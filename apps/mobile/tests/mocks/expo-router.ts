import React from "react";

export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  setParams: () => {},
});

export const useLocalSearchParams = () => ({});
export const usePathname = () => "/";

export const Slot = (props: { children?: React.ReactNode }) =>
  props.children ? React.createElement(React.Fragment, null, props.children) : null;

export const Stack = Object.assign(
  (props: { children?: React.ReactNode }) =>
    props.children ? React.createElement(React.Fragment, null, props.children) : null,
  {
    Screen: () => null,
  }
);

export const Tabs = Object.assign(
  (props: { children?: React.ReactNode }) =>
    props.children ? React.createElement(React.Fragment, null, props.children) : null,
  {
    Screen: () => null,
  }
);

export const Redirect = () => null;

export default {
  useRouter,
  useLocalSearchParams,
  usePathname,
  Slot,
  Stack,
  Tabs,
  Redirect,
};
