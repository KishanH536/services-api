import { cloneDeep } from 'lodash-es'

import resolveUpdates from '../resolve_updates.js'

describe('Resolving rule updates', () => {
  it('Categorizes old rules for deletion when they do not have a matching new rule.', () => {
    const oldRule = {
      id: '123',
      integratorId: 'xyz',
    }

    const { toDelete } = resolveUpdates([oldRule], [])

    expect(toDelete).toHaveLength(1)
    expect(toDelete[0]).toEqual(oldRule.id)
  })

  it('Categorizes new rules for addition when they do not have a matching old rule.', () => {
    const newRule = {
      id: '123',
      integratorId: 'xyz',
    }

    const { toAdd } = resolveUpdates([], [newRule])

    expect(toAdd).toHaveLength(1)
    expect(toAdd[0]).toEqual(newRule)
  })

  it('Categorizes rules for replacement when they have a matching old rule but are not equal.', () => {
    const oldRule = {
      id: '123',
      integratorId: 'xyz',
      name: 'old',
    }

    const newRule = {
      id: '123',
      integratorId: 'xyz',
      name: 'new',
    }

    const { toDelete, toAdd } = resolveUpdates([oldRule], [newRule])

    expect(toDelete).toHaveLength(1)
    expect(toDelete[0]).toEqual(oldRule.id)

    expect(toAdd).toHaveLength(1)
    expect(toAdd[0]).toEqual(newRule)
  })

  it('Does not categorize rules for replacement when they are unchanged.', () => {
    const oldRule = {
      id: '123',
      integratorId: 'xyz',
      name: 'test',
      active: true,
      objectType: 'person',
      detectionType: 'countDetection',
      detectionPeriod: 5,
      detectionMin: 1,
      detectionMax: 10,
      zones: [],
      meta: {},
      categories: ['person'],
    }

    const newRule = cloneDeep(oldRule)

    const { toDelete, toAdd } = resolveUpdates([oldRule], [newRule])

    expect(toDelete).toHaveLength(0)
    expect(toAdd).toHaveLength(0)
  })
})
