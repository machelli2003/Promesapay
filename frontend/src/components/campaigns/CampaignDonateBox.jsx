import DonateBox from "../profile/DonateBox";
import CoffeeBox from "../profile/CoffeeBox";

export default function CampaignDonateBox({ paymentType = "donation", onDonate }) {
  if (paymentType === "coffee") {
    return <CoffeeBox onBuy={onDonate} />;
  }
  return <DonateBox onDonate={onDonate} />;
}
