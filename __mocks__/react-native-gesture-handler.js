// Mock for react-native-gesture-handler
const React = require('react');
const { View, TouchableOpacity, ScrollView, FlatList, Switch, TextInput } = require('react-native');

const Swipeable = View;
const DrawerLayout = View;
const State = {};
const PanGestureHandler = View;
const TapGestureHandler = View;
const FlingGestureHandler = View;
const ForceTouchGestureHandler = View;
const LongPressGestureHandler = View;
const PinchGestureHandler = View;
const RotationGestureHandler = View;
const NativeViewGestureHandler = View;
const RawButton = View;
const BaseButton = View;
const RectButton = View;
const BorderlessButton = View;
const GestureHandlerRootView = View;
const Gesture = { Pan: () => ({}), Tap: () => ({}), LongPress: () => ({}) };
const GestureDetector = View;
const Directions = {};
const gestureHandlerRootHOC = (Component) => Component;
const createNativeWrapper = (Component) => Component;

module.exports = {
  __esModule: true,
  Swipeable,
  DrawerLayout,
  State,
  PanGestureHandler,
  TapGestureHandler,
  FlingGestureHandler,
  ForceTouchGestureHandler,
  LongPressGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  NativeViewGestureHandler,
  RawButton,
  BaseButton,
  RectButton,
  BorderlessButton,
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
  Directions,
  gestureHandlerRootHOC,
  createNativeWrapper,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  FlatList,
};
