import re
import base64
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

from ..db import (
    users_col,
    campaigns_col,
    campaign_updates_col,
    comments_col,
    donations_col,
)
from ..models.campaign import create_campaign_doc, CAMPAIGN_CATEGORIES
from ..models.campaign_update import create_campaign_update_doc
from ..models.comment import create_comment_doc
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError, NotFoundError, AuthenticationError

campaigns_bp = Blueprint("campaigns", __name__)


def _slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:60] or "campaign"


def _unique_slug(base, owner_username):
    candidate = f"{base}-{owner_username}"[:80]
    slug = candidate
    n = 1
    while campaigns_col.find_one({"slug": slug}):
        slug = f"{candidate}-{n}"[:80]
        n += 1
    return slug


def _attach_owner(campaign):
    data = serialize_doc(campaign)
    owner = users_col.find_one({"_id": ObjectId(campaign["owner_id"])})
    if owner:
        data["owner"] = {
            "id": str(owner["_id"]),
            "username": owner.get("username"),
            "full_name": owner.get("full_name"),
            "profile_picture": owner.get("profile_picture", ""),
        }
    if campaign.get("goal_amount", 0) > 0:
        data["percent_funded"] = min(
            100, round((data.get("amount_raised", 0) / campaign["goal_amount"]) * 100)
        )
    else:
        data["percent_funded"] = 0
    return data


def _extract_cover_image():
    if request.is_json:
        data = request.get_json() or {}
        return (data.get("cover_image") or "").strip()

    if "cover_image" in request.files:
        file = request.files["cover_image"]
        if not file or file.filename == "":
            raise ValidationError("No image file provided")

        allowed_types = {"image/jpeg", "image/png", "image/gif", "image/webp"}
        if file.content_type not in allowed_types:
            raise ValidationError("Invalid image format. Use JPEG, PNG, GIF, or WebP")

        file_data = file.read()
        if len(file_data) > 5000000:
            raise ValidationError("Image too large (max 5MB)")

        mime_type = file.content_type or "image/jpeg"
        encoded = base64.b64encode(file_data).decode("utf-8")
        return f"data:{mime_type};base64,{encoded}"

    if request.form:
        return (request.form.get("cover_image") or "").strip()

    return ""


@campaigns_bp.route("/categories", methods=["GET"])
def list_categories():
    return jsonify({"categories": CAMPAIGN_CATEGORIES}), 200


@campaigns_bp.route("/", methods=["GET"])
def list_campaigns():
    q = request.args.get("q", "").strip()
    category = request.args.get("category", "").strip()
    sort = request.args.get("sort", "newest")
    page = max(1, int(request.args.get("page", 1)))
    per_page = min(50, max(1, int(request.args.get("per_page", 12))))
    skip = (page - 1) * per_page

    query = {"status": "active"}
    if category and category in CAMPAIGN_CATEGORIES:
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"story": {"$regex": q, "$options": "i"}},
        ]

    if sort == "almost_funded":
        pipeline = [
            {"$match": query},
            {
                "$addFields": {
                    "percent_funded": {
                        "$cond": [
                            {"$gt": ["$goal_amount", 0]},
                            {
                                "$multiply": [
                                    {"$divide": ["$amount_raised", "$goal_amount"]},
                                    100,
                                ]
                            },
                            0,
                        ]
                    }
                }
            },
            {"$sort": {"percent_funded": -1, "created_at": -1}},
            {"$skip": skip},
            {"$limit": per_page},
        ]
        items = list(campaigns_col.aggregate(pipeline))
        total = campaigns_col.count_documents(query)
    else:
        sort_map = {
            "newest": ("created_at", -1),
            "raised": ("amount_raised", -1),
            "goal": ("goal_amount", -1),
        }
        sort_field, sort_dir = sort_map.get(sort, ("created_at", -1))
        cursor = (
            campaigns_col.find(query)
            .sort(sort_field, sort_dir)
            .skip(skip)
            .limit(per_page)
        )
        items = list(cursor)
        total = campaigns_col.count_documents(query)

    return jsonify({
        "campaigns": [_attach_owner(c) for c in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "categories": CAMPAIGN_CATEGORIES,
    }), 200


@campaigns_bp.route("/me", methods=["GET"])
@jwt_required()
def my_campaigns():
    user_id = get_jwt_identity()
    items = list(
        campaigns_col.find({"owner_id": user_id}).sort("created_at", -1)
    )
    return jsonify({"campaigns": [_attach_owner(c) for c in items]}), 200


@campaigns_bp.route("/", methods=["POST"])
@jwt_required()
def create_campaign():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) if request.is_json else {}
    if data is None:
        data = {}

    title = (data.get("title") or "").strip()
    if not title:
        raise ValidationError("Title is required")
    if len(title) > 120:
        raise ValidationError("Title cannot exceed 120 characters")

    story = (data.get("story") or "").strip()
    if len(story) > 10000:
        raise ValidationError("Story cannot exceed 10000 characters")

    category = data.get("category", "Other")
    if category not in CAMPAIGN_CATEGORIES:
        raise ValidationError("Invalid category")

    payment_type = data.get("payment_type", "donation")
    if payment_type not in ["donation", "coffee"]:
        raise ValidationError("Invalid payment type. Must be 'donation' or 'coffee'")

    try:
        goal_amount = float(data.get("goal_amount") or 0)
        if goal_amount < 0:
            raise ValueError
    except (TypeError, ValueError):
        raise ValidationError("Invalid goal amount")

    owner = users_col.find_one({"_id": ObjectId(user_id)})
    if not owner:
        raise NotFoundError("User not found")

    slug = _unique_slug(_slugify(title), owner["username"])
    doc = create_campaign_doc(
        owner_id=user_id,
        slug=slug,
        title=title,
        story=story,
        category=category,
        goal_amount=goal_amount,
        cover_image=_extract_cover_image(),
        payment_type=payment_type,
    )
    campaigns_col.insert_one(doc)

    return jsonify({
        "message": "Campaign created",
        "campaign": _attach_owner(doc),
    }), 201


@campaigns_bp.route("/<slug>", methods=["GET"])
def get_campaign(slug):
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")

    data = _attach_owner(campaign)

    recent_donations = list(
        donations_col.find(
            {"campaign_id": str(campaign["_id"]), "status": "success"},
            {"donor_name": 1, "amount": 1, "message": 1, "created_at": 1},
        )
        .sort("created_at", -1)
        .limit(10)
    )
    data["recent_donors"] = [serialize_doc(d) for d in recent_donations]

    return jsonify({"campaign": data}), 200


@campaigns_bp.route("/<slug>", methods=["PUT"])
@jwt_required()
def update_campaign(slug):
    user_id = get_jwt_identity()
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")
    if campaign["owner_id"] != user_id:
        raise AuthenticationError("Not authorized to edit this campaign")

    data = request.get_json() or {}
    allowed = ["title", "story", "category", "goal_amount", "cover_image", "status"]
    update_data = {k: v for k, v in data.items() if k in allowed}

    if "title" in update_data:
        if not update_data["title"].strip():
            raise ValidationError("Title cannot be empty")
        update_data["title"] = update_data["title"].strip()

    if "story" in update_data:
        update_data["story"] = update_data["story"].strip()

    if "category" in update_data and update_data["category"] not in CAMPAIGN_CATEGORIES:
        raise ValidationError("Invalid category")

    if "goal_amount" in update_data:
        try:
            update_data["goal_amount"] = float(update_data["goal_amount"])
            if update_data["goal_amount"] < 0:
                raise ValueError
        except (TypeError, ValueError):
            raise ValidationError("Invalid goal amount")

    if "status" in update_data and update_data["status"] not in ("active", "paused", "completed"):
        raise ValidationError("Invalid status")

    if not update_data:
        raise ValidationError("No valid fields to update")

    update_data["updated_at"] = datetime.utcnow()
    campaigns_col.update_one({"_id": campaign["_id"]}, {"$set": update_data})
    updated = campaigns_col.find_one({"_id": campaign["_id"]})

    return jsonify({
        "message": "Campaign updated",
        "campaign": _attach_owner(updated),
    }), 200


@campaigns_bp.route("/<slug>/updates", methods=["GET"])
def list_updates(slug):
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")

    campaign_id = str(campaign["_id"])
    updates = list(
        campaign_updates_col.find({"campaign_id": campaign_id}).sort("created_at", -1)
    )

    result = []
    for u in updates:
        item = serialize_doc(u)
        author = users_col.find_one({"_id": ObjectId(u["author_id"])})
        if author:
            item["author"] = {
                "username": author.get("username"),
                "full_name": author.get("full_name"),
                "profile_picture": author.get("profile_picture", ""),
            }
        result.append(item)

    return jsonify({"updates": result}), 200


@campaigns_bp.route("/<slug>/updates", methods=["POST"])
@jwt_required()
def post_update(slug):
    user_id = get_jwt_identity()
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")
    if campaign["owner_id"] != user_id:
        raise AuthenticationError("Only the campaign owner can post updates")

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    body = (data.get("body") or "").strip()
    if not body:
        raise ValidationError("Update body is required")
    if len(body) > 5000:
        raise ValidationError("Update cannot exceed 5000 characters")

    doc = create_campaign_update_doc(
        campaign_id=str(campaign["_id"]),
        author_id=user_id,
        title=title or "Campaign update",
        body=body,
    )
    campaign_updates_col.insert_one(doc)

    item = serialize_doc(doc)
    author = users_col.find_one({"_id": ObjectId(user_id)})
    if author:
        item["author"] = {
            "username": author.get("username"),
            "full_name": author.get("full_name"),
            "profile_picture": author.get("profile_picture", ""),
        }

    return jsonify({"message": "Update posted", "update": item}), 201


@campaigns_bp.route("/<slug>/comments", methods=["GET"])
def list_comments(slug):
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")

    campaign_id = str(campaign["_id"])
    comments = list(
        comments_col.find({"campaign_id": campaign_id}).sort("created_at", -1).limit(100)
    )

    return jsonify({"comments": [serialize_doc(c) for c in comments]}), 200


@campaigns_bp.route("/<slug>/comments", methods=["POST"])
def post_comment(slug):
    campaign = campaigns_col.find_one({"slug": slug.lower()})
    if not campaign:
        raise NotFoundError("Campaign not found")

    data = request.get_json() or {}
    author_name = (data.get("author_name") or "").strip()
    body = (data.get("body") or "").strip()

    if not author_name:
        raise ValidationError("Your name is required")
    if not body:
        raise ValidationError("Comment cannot be empty")
    if len(body) > 2000:
        raise ValidationError("Comment cannot exceed 2000 characters")

    doc = create_comment_doc(
        campaign_id=str(campaign["_id"]),
        author_name=author_name,
        body=body,
    )
    comments_col.insert_one(doc)

    return jsonify({"message": "Comment added", "comment": serialize_doc(doc)}), 201
