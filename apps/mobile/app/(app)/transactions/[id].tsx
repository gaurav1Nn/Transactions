import React from "react";
import { useLocalSearchParams } from "expo-router";
import { TransactionDetails } from "../../../src/features/transactions/TransactionDetails";

export default function TransactionDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <TransactionDetails id={id || ""} />;
}
