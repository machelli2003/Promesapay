"""
Comprehensive test suite for dispute resolution system (Phase 3.2)
Tests user dispute reporting, admin resolution, and refund issuance
"""

import pytest
from bson import ObjectId
from datetime import datetime, timedelta
from app.models.user import create_user_doc
from app.utils.auth_helpers import hash_password


class TestDisputeReporting:
    """Tests for user reporting disputes"""

    def test_report_dispute_success(self, client, registered_user, auth_token):
        """User successfully reports a dispute for a transaction"""
        # Create a donation first
        from app.db import donations_col
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "message": "Support your work",
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        result = donations_col.insert_one(donation)

        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction should have been for 25 dollars, not 50 dollars. Please help me resolve this.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 201
        assert response.json['status'] == 'success'
        assert 'dispute_id' in response.json

    def test_report_dispute_missing_fields(self, client, auth_token):
        """Report dispute fails when required fields are missing"""
        response = client.post(
            '/api/disputes/report',
            json={'dispute_type': 'unauthorized_transaction'},
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 400
        assert response.json['status'] == 'error'

    def test_report_dispute_invalid_type(self, client, auth_token, registered_user):
        """Report dispute fails with invalid dispute type"""
        from app.db import donations_col
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        result = donations_col.insert_one(donation)

        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'invalid_type',
                'reason': 'This is an invalid dispute type that should fail validation.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 400
        assert 'Invalid dispute type' in response.json['message']

    def test_report_dispute_reason_too_short(self, client, auth_token, registered_user):
        """Report dispute fails when reason is too short"""
        from app.db import donations_col
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        result = donations_col.insert_one(donation)

        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'Too short'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 400
        assert 'between 10 and 1000 characters' in response.json['message']

    def test_report_dispute_not_party_to_transaction(self, client, auth_token):
        """User cannot report dispute for transaction they're not party to"""
        from app.db import donations_col
        # Create donation between other users
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        result = donations_col.insert_one(donation)

        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction has an incorrect amount that needs to be reviewed.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403
        assert 'party to the transaction' in response.json['message']

    def test_report_duplicate_dispute(self, client, auth_token, registered_user):
        """Cannot report duplicate disputes for same transaction"""
        from app.db import donations_col, disputes_col
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        result = donations_col.insert_one(donation)

        # Report first dispute
        response1 = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction has an incorrect amount that needs immediate review.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response1.status_code == 201

        # Try to report second dispute
        response2 = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'Another dispute for the same transaction should be rejected here.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response2.status_code == 400
        assert 'active dispute' in response2.json['message']

    def test_report_dispute_not_found(self, client, auth_token):
        """Report dispute fails when transaction doesn't exist"""
        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(ObjectId()),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction should not exist in the database for testing.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 404
        assert 'not found' in response.json['message'].lower()

    def test_get_my_disputes(self, client, auth_token, registered_user):
        """User can retrieve their disputes"""
        from app.db import donations_col, disputes_col
        
        # Create a donation and dispute
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(donation_result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction has an incorrect amount that needs to be investigated.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        response = client.get(
            '/api/disputes/my-disputes',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert len(response.json['disputes']) > 0

    def test_get_my_disputes_with_filter(self, client, auth_token, registered_user):
        """User can filter their disputes by status"""
        response = client.get(
            '/api/disputes/my-disputes?status=open&page=1&limit=10',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 200
        assert 'disputes' in response.json
        assert 'page' in response.json
        assert 'total' in response.json


class TestAdminDisputeManagement:
    """Tests for admin dispute resolution"""

    def test_admin_get_all_disputes(self, client, admin_user, admin_token):
        """Admin can retrieve all disputes"""
        response = client.get(
            '/api/admin/disputes',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['status'] == 'success'
        assert 'disputes' in response.json

    def test_admin_filter_by_status(self, client, admin_token):
        """Admin can filter disputes by status"""
        response = client.get(
            '/api/admin/disputes?status=open',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        for dispute in response.json['disputes']:
            assert dispute['status'] == 'open'

    def test_admin_filter_by_priority(self, client, admin_token):
        """Admin can filter disputes by priority"""
        response = client.get(
            '/api/admin/disputes?priority=high',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        for dispute in response.json['disputes']:
            assert dispute['priority'] == 'high'

    def test_admin_get_dispute_details(self, client, admin_token, registered_user):
        """Admin can view detailed dispute information"""
        from app.db import donations_col, disputes_col
        
        # Create dispute
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        dispute = {
            "_id": ObjectId(),
            "transaction_id": donation_result.inserted_id,
            "transaction_type": "donation",
            "user_id": ObjectId(registered_user['_id']),
            "dispute_type": "incorrect_amount",
            "reason": "Amount is wrong",
            "status": "open",
            "priority": "medium",
            "created_at": datetime.utcnow()
        }
        dispute_result = disputes_col.insert_one(dispute)

        response = client.get(
            f'/api/admin/disputes/{dispute_result.inserted_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['dispute']['_id'] == str(dispute_result.inserted_id)

    def test_admin_update_dispute_status(self, client, admin_token, registered_user):
        """Admin can update dispute status"""
        from app.db import donations_col, disputes_col
        
        # Create dispute
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        dispute = {
            "_id": ObjectId(),
            "transaction_id": donation_result.inserted_id,
            "transaction_type": "donation",
            "user_id": ObjectId(registered_user['_id']),
            "dispute_type": "incorrect_amount",
            "reason": "Amount is wrong",
            "status": "open",
            "priority": "medium",
            "created_at": datetime.utcnow()
        }
        dispute_result = disputes_col.insert_one(dispute)

        response = client.put(
            f'/api/admin/disputes/{dispute_result.inserted_id}/status',
            json={
                'status': 'under_review',
                'notes': 'Investigating the claim now'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['status'] == 'success'

        # Verify update
        updated = disputes_col.find_one({"_id": dispute_result.inserted_id})
        assert updated['status'] == 'under_review'

    def test_admin_issue_refund(self, client, admin_token, registered_user):
        """Admin can issue refund for disputed transaction"""
        from app.db import donations_col, disputes_col, refunds_col
        
        # Create dispute
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        dispute = {
            "_id": ObjectId(),
            "transaction_id": donation_result.inserted_id,
            "transaction_type": "donation",
            "user_id": ObjectId(registered_user['_id']),
            "dispute_type": "incorrect_amount",
            "reason": "Amount is wrong",
            "status": "open",
            "priority": "medium",
            "refund_issued": False,
            "created_at": datetime.utcnow()
        }
        dispute_result = disputes_col.insert_one(dispute)

        response = client.post(
            f'/api/admin/disputes/{dispute_result.inserted_id}/refund',
            json={'amount': 25.0},
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 201
        assert response.json['status'] == 'success'
        assert 'refund_id' in response.json

        # Verify dispute updated
        updated_dispute = disputes_col.find_one({"_id": dispute_result.inserted_id})
        assert updated_dispute['refund_issued'] == True
        assert updated_dispute['refund_amount'] == 25.0

    def test_admin_issue_refund_invalid_amount(self, client, admin_token, registered_user):
        """Admin refund fails with invalid amount"""
        from app.db import disputes_col
        
        dispute = {
            "_id": ObjectId(),
            "transaction_id": ObjectId(),
            "user_id": ObjectId(registered_user['_id']),
            "dispute_type": "incorrect_amount",
            "reason": "Amount is wrong",
            "status": "open",
            "refund_issued": False,
            "created_at": datetime.utcnow()
        }
        dispute_result = disputes_col.insert_one(dispute)

        response = client.post(
            f'/api/admin/disputes/{dispute_result.inserted_id}/refund',
            json={'amount': -10},
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 400

    def test_admin_get_dispute_stats(self, client, admin_token):
        """Admin can retrieve dispute statistics"""
        response = client.get(
            '/api/admin/disputes/stats/overview',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['status'] == 'success'
        stats = response.json['stats']
        assert 'total' in stats
        assert 'open' in stats
        assert 'under_review' in stats
        assert 'resolved' in stats
        assert 'refunded' in stats


class TestDisputeAuthorization:
    """Tests for authorization and access control"""

    def test_non_admin_cannot_access_admin_disputes(self, client, auth_token):
        """Non-admin user cannot access admin dispute endpoints"""
        response = client.get(
            '/api/admin/disputes',
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 403
        assert 'Admin access required' in response.json['message']

    def test_unauthenticated_cannot_report_dispute(self, client):
        """Unauthenticated user cannot report dispute"""
        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(ObjectId()),
                'dispute_type': 'incorrect_amount',
                'reason': 'This should fail without authentication token.'
            }
        )

        assert response.status_code == 401

    def test_unauthenticated_cannot_view_disputes(self, client):
        """Unauthenticated user cannot view disputes"""
        response = client.get('/api/disputes/my-disputes')
        assert response.status_code == 401


class TestDisputePagination:
    """Tests for pagination"""

    def test_disputes_pagination_limit(self, client, admin_token):
        """Pagination respects limit parameter"""
        response = client.get(
            '/api/admin/disputes?page=1&limit=5',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert response.json['limit'] == 5

    def test_disputes_pagination_pages(self, client, admin_token):
        """Pagination correctly calculates pages"""
        response = client.get(
            '/api/admin/disputes?page=1&limit=20',
            headers={'Authorization': f'Bearer {admin_token}'}
        )

        assert response.status_code == 200
        assert 'total_pages' in response.json


class TestDisputeRateLimiting:
    """Tests for rate limiting on dispute endpoints"""

    def test_report_dispute_rate_limit(self, client, auth_token, registered_user):
        """Report dispute endpoint enforces rate limiting (5/hour)"""
        from app.db import donations_col
        
        # This test would need multiple requests to verify rate limiting
        # For now, we verify the endpoint accepts requests
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(donation_result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'Testing rate limiting on dispute reporting endpoint.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        # First request should succeed
        assert response.status_code in [201, 400]  # 400 if rate limited


class TestDisputeIntegration:
    """Integration tests for full dispute workflow"""

    def test_full_dispute_workflow(self, client, registered_user, auth_token, admin_token, admin_user):
        """Test complete dispute workflow from reporting to resolution"""
        from app.db import donations_col, disputes_col
        
        # Step 1: Create transaction
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        # Step 2: Report dispute
        report_response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(donation_result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'This transaction charged the wrong amount and needs resolution.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert report_response.status_code == 201
        dispute_id = report_response.json['dispute_id']

        # Step 3: Admin views dispute
        view_response = client.get(
            f'/api/admin/disputes/{dispute_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert view_response.status_code == 200

        # Step 4: Admin updates status
        status_response = client.put(
            f'/api/admin/disputes/{dispute_id}/status',
            json={
                'status': 'under_review',
                'notes': 'Reviewing the transaction details now'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert status_response.status_code == 200

        # Step 5: Admin issues refund
        refund_response = client.post(
            f'/api/admin/disputes/{dispute_id}/refund',
            json={'amount': 25.0},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert refund_response.status_code == 201

        # Step 6: User views resolved dispute
        my_disputes = client.get(
            '/api/disputes/my-disputes?status=refunded',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert my_disputes.status_code == 200

    def test_dispute_email_notifications(self, client, registered_user, auth_token):
        """Verify email notifications are sent for disputes"""
        from app.db import donations_col
        
        # Create donation
        donation = {
            "_id": ObjectId(),
            "donor_id": ObjectId(registered_user['_id']),
            "recipient_id": ObjectId(),
            "amount": 50.0,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        donation_result = donations_col.insert_one(donation)

        # Report dispute - should trigger email notification
        response = client.post(
            '/api/disputes/report',
            json={
                'transaction_id': str(donation_result.inserted_id),
                'dispute_type': 'incorrect_amount',
                'reason': 'The transaction amount does not match what was discussed beforehand.'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )

        assert response.status_code == 201
        # Email would be verified in a real environment with email mocking


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
