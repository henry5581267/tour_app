const DocumentPicker = {
  pickSingle: jest.fn(),
  isCancel: jest.fn(() => false),
  types: { zip: 'public.zip-archive' },
}
module.exports = DocumentPicker
