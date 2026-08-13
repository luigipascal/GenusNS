import { Suspense } from "react";
import CheckoutSuccessClient from "./success-client";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
