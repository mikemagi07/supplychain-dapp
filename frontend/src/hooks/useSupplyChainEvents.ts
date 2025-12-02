import { useEffect } from "react";
import { getReadOnlyContract } from "../blockchain/contract";
import { useRole } from "../components/RoleContext";

export default function useSupplyChainEvents(
  onAnyEvent: () => void,
  onMessage?: (msg: string) => void
) {
  const role = useRole();
  
  useEffect(() => {
    const contract = getReadOnlyContract();

    const notify = (msg: string) => {
      if (onMessage) onMessage(msg);
      console.log("%cEVENT:", "color: green", msg);
    };

    const handlers = {
      ProductCreated: (id: any, producer: any) => {
        notify(`Product #${id} created`);
        onAnyEvent();
      },
      ProductSentToSupplier: (id: any, supplier: any) => {
        notify(`Product #${id} sent to supplier`);
        onAnyEvent();
      },
      ProductReceivedBySupplier: (id: any) => {
        notify(`Supplier received product #${id}`);
        onAnyEvent();
      },
      ShippingInfoUpdated: (id: any) => {
        notify(`Shipping info updated for product #${id}`);
        onAnyEvent();
      },
      ProductSentToRetailer: (id: any, retailer: any) => {
        notify(`Product #${id} sent to retailer`);
        onAnyEvent();
      },
      ProductReceivedByRetailer: (id: any) => {
        notify(`Retailer received product #${id}`);
        onAnyEvent();
      },
      ProductAddedToStore: (id: any) => {
        notify(`Product #${id} is available for sale`);
        onAnyEvent();
      },
      ProductSoldToConsumer: (id: any, consumer: any) => {
        notify(`Product #${id} sold to consumer`);
        onAnyEvent();
      },
    };

    // Attach listeners
    for (const eventName of Object.keys(handlers)) {
      contract.on(eventName, handlers[eventName as keyof typeof handlers]);
    }

    // Cleanup listeners on unmount
    return () => {
      for (const eventName of Object.keys(handlers)) {
        contract.off(eventName, handlers[eventName as keyof typeof handlers]);
      }
    };
  }, [role, onAnyEvent, onMessage]);
}
