import { normalizePath } from '../utils.js'

function normalizePathTest({ path, expected }) {
  const result = normalizePath(path)
  expect(result).toStrictEqual(expected)
}

const paths = [
  {
    path: '',
    expected: '',
  },
  {
    path: '/',
    expected: '',
  },
  {
    path: undefined,
    expected: '',
  },
  {
    path: null,
    expected: '',
  },
  {
    path: '/services',
    expected: '/services',
  },
  {
    path: '/services/',
    expected: '/services',
  },
  {
    path: 'services/',
    expected: '/services',
  },
  {
    path: '/services/',
    expected: '/services',
  },
]

test.each(paths)(
  'normalize env var path, "$path"',
  normalizePathTest,
)
