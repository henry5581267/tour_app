const mockDocRef = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  onSnapshot: jest.fn(() => jest.fn()),
}

const mockCollectionRef = {
  doc: jest.fn(() => mockDocRef),
}

const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
}

const mockFirestore = {
  collection: jest.fn(() => mockCollectionRef),
  batch: jest.fn(() => mockBatch),
  runTransaction: jest.fn(),
}

const firestore = jest.fn(() => mockFirestore)

firestore.FieldValue = {
  arrayUnion: jest.fn((...args) => ({ _type: 'arrayUnion', args })),
  arrayRemove: jest.fn((...args) => ({ _type: 'arrayRemove', args })),
}

firestore.__mockFirestore = mockFirestore
firestore.__mockDocRef = mockDocRef
firestore.__mockCollectionRef = mockCollectionRef
firestore.__mockBatch = mockBatch

module.exports = firestore
