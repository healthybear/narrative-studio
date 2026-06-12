import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import ProjectFormDrawer from '~/features/novel/components/ProjectFormDrawer.vue'

const validateMock = vi.fn().mockResolvedValue(undefined)

const NFormStub = defineComponent({
  name: 'NForm',
  setup(_, { slots, expose }) {
    expose({
      validate: (...args: unknown[]) => validateMock(...args),
      restoreValidation: vi.fn(),
    })

    return () => h('form', slots.default?.())
  },
})

const testStubs = {
  NDrawer: defineComponent({
    name: 'NDrawer',
    props: {
      show: Boolean,
    },
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NDrawerContent: defineComponent({
    name: 'NDrawerContent',
    setup(_, { slots }) {
      return () => h('section', [
        slots.default?.(),
        slots.footer?.(),
      ])
    },
  }),
  NForm: NFormStub,
  NFormItem: defineComponent({
    name: 'NFormItem',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NGrid: defineComponent({
    name: 'NGrid',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NGi: defineComponent({
    name: 'NGi',
    setup(_, { slots }) {
      return () => h('div', slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    props: {
      value: {
        type: String,
        default: '',
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () => h('input', {
        value: props.value,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value),
      })
    },
  }),
  NInputNumber: defineComponent({
    name: 'NInputNumber',
    props: {
      value: {
        type: Number,
        default: null,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () => h('input', {
        type: 'number',
        value: props.value ?? '',
        onInput: (event: Event) => {
          const value = (event.target as HTMLInputElement).value
          emit('update:value', value ? Number(value) : null)
        },
      })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      loading: Boolean,
      disabled: Boolean,
    },
    emits: ['click'],
    setup(props, { slots, emit }) {
      return () => h('button', {
        disabled: props.disabled || props.loading,
        'data-loading': props.loading ? 'true' : 'false',
        onClick: () => emit('click'),
      }, slots.default?.())
    },
  }),
}

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

describe('project form drawer', () => {
  it('keeps the submit button locked while parent submission is pending', async () => {
    validateMock.mockResolvedValueOnce(undefined)
    const deferred = createDeferred()
    const submitSpy = vi.fn(async () => {
      submitting.value = true
      await deferred.promise
      submitting.value = false
    })
    const submitting = ref(false)

    const Harness = defineComponent({
      components: { ProjectFormDrawer },
      setup() {
        const show = ref(true)

        return () => h(ProjectFormDrawer, {
          show: show.value,
          submitting: submitting.value,
          'onUpdate:show': (value: boolean) => {
            show.value = value
          },
          onSubmit: submitSpy,
        })
      },
    })

    const wrapper = mount(Harness, {
      global: {
        stubs: testStubs,
      },
    })

    const submitButton = wrapper.findAll('button').find(button => button.text().includes('创建项目'))
    expect(submitButton).toBeDefined()

    await submitButton!.trigger('click')
    await nextTick()

    expect(submitSpy).toHaveBeenCalledTimes(1)
    expect(submitButton!.attributes('data-loading')).toBe('true')
    expect(submitButton!.attributes('disabled')).toBeDefined()

    await submitButton!.trigger('click')
    expect(submitSpy).toHaveBeenCalledTimes(1)

    deferred.resolve()
    await nextTick()
    await nextTick()

    expect(submitButton!.attributes('data-loading')).toBe('false')
  })
})
