jest.mock('@/config/configuration');
jest.mock('@/config/logger');

// add all the common mocks needed by all express based test cases
jest.mock('@/config/setup-env');
jest.mock('@/config/services');
jest.mock('@/model/store');
