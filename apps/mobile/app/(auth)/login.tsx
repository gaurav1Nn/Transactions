import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { AuthShell } from "../../src/features/auth/AuthShell";
import { AppTextField } from "../../src/components/forms/AppTextField";
import { PasswordField } from "../../src/components/forms/PasswordField";
import { AppButton } from "../../src/components/forms/AppButton";
import { InlineNotice } from "../../src/components/feedback/InlineNotice";
import { useLogin } from "../../src/features/auth/useLogin";
import { loginSchema } from "../../src/features/auth/login.schema";
import { colors } from "../../src/theme/colors";
import { space } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<TextInput>(null);
  const router = useRouter();
  const { login, isLoading, error, clearError } = useLogin();

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "email" && !errors.email) {
          errors.email = issue.message;
        }
        if (issue.path[0] === "password" && !errors.password) {
          errors.password = issue.message;
        }
      }
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    clearError();
    if (!validateForm()) return;

    const success = await login({ email, password });
    if (!success) {
      // Clear password on failed attempt
      setPassword("");
      passwordRef.current?.focus();
    }
  };

  return (
    <AuthShell
      currentTab="login"
      title="ACE Transactions"
      tagline="Create, simulate and track payments."
      footerAction={
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/register")}
          accessibilityRole="button"
          accessibilityLabel="Create an account"
        >
          <Text style={[styles.createAccountLink, typography.bodySm]}>
            New here? <Text style={styles.linkHighlight}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        <AppTextField
          label="Email"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leadingIcon="email"
          error={fieldErrors.email}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!isLoading}
        />

        <PasswordField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={(val) => {
            setPassword(val);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="••••••••••••"
          error={fieldErrors.password}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
        />

        {Boolean(error) && (
          <InlineNotice
            variant="error"
            message={error!.message}
            actionText={error?.requestId ? `Ref: ${error.requestId}` : undefined}
          />
        )}

        <View style={styles.buttonWrap}>
          <AppButton
            label="Sign in"
            loadingLabel="Signing in…"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !email.trim() || !password}
            trailingIcon="forward"
          />
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.md,
  },
  buttonWrap: {
    marginTop: space.sm,
  },
  createAccountLink: {
    color: colors.inkSoft,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: "600",
  },
});
