import { useEffect, useRef } from "react";
import { getReadOnlyContract } from "../blockchain/contract";

export default function useSupplyChainEvents(
  onAnyEvent: () => void,
  onMessage?: (msg: string) => void
) {
  // Use refs to store the latest callbacks without causing re-subscriptions
  const onAnyEventRef = useRef(onAnyEvent);
  const onMessageRef = useRef(onMessage);

  // Update refs when callbacks change
  useEffect(() => {
    onAnyEventRef.current = onAnyEvent;
    onMessageRef.current = onMessage;
  }, [onAnyEvent, onMessage]);

  useEffect(() => {
    const contract = getReadOnlyContract();

    const notify = (msg: string) => {
      if (onMessageRef.current) onMessageRef.current(msg);
    };

    const handlers = {
      ProductCreated: (id: any, producer: any) => {
        notify(`Product #${id} created`);
        onAnyEventRef.current();
      },
      ProductSentToSupplier: (id: any, supplier: any) => {
        notify(`Product #${id} sent to supplier`);
        onAnyEventRef.current();
      },
      ProductReceivedBySupplier: (id: any) => {
        notify(`Supplier received product #${id}`);
        onAnyEventRef.current();
      },
      ShippingInfoUpdated: (id: any) => {
        notify(`Shipping info updated for product #${id}`);
        onAnyEventRef.current();
      },
      ProductSentToRetailer: (id: any, retailer: any) => {
        notify(`Product #${id} sent to retailer`);
        onAnyEventRef.current();
      },
      ProductReceivedByRetailer: (id: any) => {
        notify(`Retailer received product #${id}`);
        onAnyEventRef.current();
      },
      ProductAddedToStore: (id: any) => {
        notify(`Product #${id} is available for sale`);
        onAnyEventRef.current();
      },
      ProductSoldToConsumer: (id: any, consumer: any) => {
        notify(`Product #${id} sold to consumer`);
        onAnyEventRef.current();
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
  }, []); // Empty dependency array - only set up listeners once
}
