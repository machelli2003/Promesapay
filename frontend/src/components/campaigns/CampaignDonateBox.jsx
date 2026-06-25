import DonateBox from "../profile/DonateBox";
import DollBox from "../profile/DollBox";

export default function CampaignDonateBox({ paymentType = "donation", onDonate }) {
  if (paymentType === "doll") {
    return <DollBox onBuy={onDonate} />;
  }
  return <DonateBox onDonate={onDonate} />;
}
