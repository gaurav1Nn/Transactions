import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { AuthShell } from "../../src/features/auth/AuthShell.js";
import { AppTextField } from "../../src/components/forms/AppTextField.js";
import { PasswordField } from "../../src/components/forms/PasswordField.js";
import { AppButton } from "../../src/components/forms/AppButton.js";
import { InlineNotice } from "../../src/components/feedback/InlineNotice.js";
import { PasswordRequirements } from "../../src/features/auth/PasswordRequirements.js";
import { useRegister } from "../../src/features/auth/useRegister.js";
import { registerSchema } from "../../src/features/auth/register.schema.js";
import { colors } from "../../src/theme/colors.js";
import { space } from "../../src/theme/spacing.js";
import { typography } from "../../src/theme/typography.js";

export default function RegisterScreen(): React.JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const router = useRouter();
  const { register, isLoading, serverError, serverFieldErrors, clearErrors } = useRegister();

  const validateForm = (): boolean => {
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as keyof typeof fieldErrors;
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    clearErrors();
    if (!validateForm()) return;

    await register({
      name,
      email,
      password,
    });
  };

  const activeEmailError = fieldErrors.email || serverFieldErrors.email;

  return (
    <AuthShell
      currentTab="register"
      title="Create your account"
      tagline="It takes less than a minute."
      footerAction={
        <TouchableOpacity
          onPress={() => router.replace("/(auth)/login")}
          accessibilityRole="button"
          accessibilityLabel="Sign in to your account"
        >
          <Text style={[styles.loginLink, typography.bodySm]}>
            Already have an account? <Text style={styles.linkHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.form}>
        <AppTextField
          label="Full Name"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Jane Doe"
          autoCapitalize="words"
          autoCorrect={false}
          leadingIcon="profile"
          error={fieldErrors.name}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          editable={!isLoading}
        />

        <AppTextField
          ref={emailRef}
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
          error={activeEmailError}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!isLoading}
        />

        {serverFieldErrors.email ? (
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.signInInstead}
            accessibilityRole="button"
          >
            <Text style={[styles.signInInsteadText, typography.caption]}>
              A user with this email already exists. <Text style={styles.linkHighlight}>Sign in instead</Text>
            </Text>
          </TouchableOpacity>
        ) : null}

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
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          editable={!isLoading}
        />

        <PasswordRequirements password={password} />

        <PasswordField
          ref={confirmPasswordRef}
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(val) => {
            setConfirmPassword(val);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          placeholder="••••••••••••"
          error={fieldErrors.confirmPassword}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          editable={!isLoading}
        />

        {Boolean(serverError) && (
          <InlineNotice
            variant="error"
            message={serverError!.message}
            actionText={serverError?.requestId ? `Ref: ${serverError.requestId}` : undefined}
          />
        )}

        <View style={styles.buttonWrap}>
          <AppButton
            label="Create account"
            loadingLabel="Creating account…"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !name.trim() || !email.trim() || !password || !confirmPassword}
            trailingIcon="forward"
          />
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.sm,
  },
  signInInstead: {
    marginTop: -space.xs,
    marginBottom: space.xs,
  },
  signInInsteadText: {
    color: colors.failed,
  },
  buttonWrap: {
    marginTop: space.sm,
  },
  loginLink: {
    color: colors.inkSoft,
  },
  linkHighlight: {
    color: colors.primary,
    fontWeight: "600",
  },
});
