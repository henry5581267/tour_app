// Mock for react-native-draggable-flatlist
const React = require('react');
const { FlatList } = require('react-native');

const DraggableFlatList = (props) => {
  const { data, renderItem, keyExtractor } = props;
  return React.createElement(FlatList, {
    data,
    renderItem,
    keyExtractor,
  });
};

module.exports = {
  __esModule: true,
  default: DraggableFlatList,
  DraggableFlatList,
};
