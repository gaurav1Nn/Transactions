import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors.js";
import { space } from "../../theme/spacing.js";
import { typography } from "../../theme/typography.js";
import { AppIcon } from "../../components/layout/AppIcon.js";
import { passwordCriteria } from "./register.schema.js";

export interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({
  password,
}: PasswordRequirementsProps): React.JSX.Element {
  const requirements = [
    {
      id: "length",
      label: "8 to 128 characters",
      met: passwordCriteria.minLength(password),
    },
    {
      id: "case",
      label: "Upper and lowercase letters",
      met: passwordCriteria.hasCase(password),
    },
    {
      id: "number",
      label: "At least one number",
      met: passwordCriteria.hasNumber(password),
    },
    {
      id: "special",
      label: "At least one special character",
      met: passwordCriteria.hasSpecial(password),
    },
  ];

  return (
    <View style={styles.container}>
      {requirements.map((req) => (
        <View key={req.id} style={styles.row}>
          <AppIcon
            name={req.met ? "statusSuccess" : "statusPending"}
            size={14}
            color={req.met ? colors.success : colors.inkMuted}
          />
          <Text
            style={[
              styles.label,
              typography.caption,
              { color: req.met ? colors.success : colors.inkSoft },
            ]}
          >
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: space.xs,
    paddingHorizontal: space.xs,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    marginLeft: space.xs,
  },
});
