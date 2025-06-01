import { mount } from '@vue/test-utils';
import EditableText from './EditableText.vue';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import vuetify from '@/plugins/vuetify'; // Ensure Vuetify is available
import { createPinia, setActivePinia } from 'pinia'; // If any store is implicitly used by Vuetify components

// Global Vuetify and Pinia setup for tests in this file
beforeEach(() => {
  setActivePinia(createPinia()); // Create a new Pinia instance for each test
});

describe('EditableText.vue', () => {
  // Factory function to mount the component
  const factory = (props = {}, options = {}) => {
    return mount(EditableText, {
      props: { modelValue: 'Initial Text', ...props },
      global: {
        plugins: [vuetify], // Use Vuetify instance from plugins
        // If your component uses $t directly, provide a simple mock here
        // For components using useI18n(), you might need a more complex setup or mock the composable
        mocks: {
          $t: (key) => key, // Simple pass-through mock for $t
        },
        ...options.global, // Allow overriding global options
      },
      ...options, // Allow overriding mount options
    });
  };

  it('renders initial text in display mode', () => {
    const wrapper = factory();
    const displayElement = wrapper.find('[data-testid="editable-text-display"]');
    expect(displayElement.exists()).toBe(true);
    expect(displayElement.text()).toContain('Initial Text');
    // Check that input field is not present
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="editable-textarea"]').exists()).toBe(false);
  });

  it('switches to edit mode on click (single line)', async () => {
    const wrapper = factory();
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const textField = wrapper.find('[data-testid="editable-textfield"]');
    expect(textField.exists()).toBe(true);
    // For v-text-field, the input element is nested.
    expect(textField.find('input').element.value).toBe('Initial Text');
  });

  it('switches to edit mode on click (multi-line)', async () => {
    const wrapper = factory({ multiline: true, modelValue: 'Initial Multiline' });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const textArea = wrapper.find('[data-testid="editable-textarea"]');
    expect(textArea.exists()).toBe(true);
    expect(textArea.find('textarea').element.value).toBe('Initial Multiline');
  });

  it('emits update:modelValue on save (single line)', async () => {
    const wrapper = factory();
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const inputElement = wrapper.find('[data-testid="editable-textfield"]').find('input');
    await inputElement.setValue('Updated Text');

    await wrapper.find('[data-testid="save-button"]').trigger('click');

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['Updated Text']);
    expect(wrapper.emitted()['save']).toBeTruthy();
    expect(wrapper.emitted()['save'][0]).toEqual(['Updated Text']);

    // Switches back to display mode
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('Updated Text');
  });

  it('emits update:modelValue on Enter key press (single line)', async () => {
    const wrapper = factory({ closeOnEnter: true });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const textField = wrapper.find('[data-testid="editable-textfield"]');
    await textField.find('input').setValue('New Value via Enter');
    await textField.trigger('keydown.enter');

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['New Value via Enter']);
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
  });

  it('emits update:modelValue on Ctrl+Enter key press (multi-line)', async () => {
    const wrapper = factory({ multiline: true });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const textArea = wrapper.find('[data-testid="editable-textarea"]');
    await textArea.find('textarea').setValue('New Multiline via Ctrl+Enter');
    // Simulate Ctrl+Enter. For textarea, Enter alone creates newline.
    await textArea.trigger('keydown.enter', { ctrlKey: true });

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['New Multiline via Ctrl+Enter']);
    expect(wrapper.find('[data-testid="editable-textarea"]').exists()).toBe(false);
  });


  it('cancels editing on clicking Cancel button', async () => {
    const wrapper = factory({ modelValue: 'Original' });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const inputElement = wrapper.find('[data-testid="editable-textfield"]').find('input');
    await inputElement.setValue('Changed but will cancel');

    await wrapper.find('[data-testid="cancel-button"]').trigger('click');

    expect(wrapper.emitted()['update:modelValue']).toBeFalsy(); // Should not emit update
    expect(wrapper.emitted()['cancel']).toBeTruthy();
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('Original'); // Reverted
  });

  it('cancels editing on Escape key press', async () => {
    const wrapper = factory({ modelValue: 'Original Escape' });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const textField = wrapper.find('[data-testid="editable-textfield"]');
    await textField.find('input').setValue('Changed but will escape');
    await textField.trigger('keydown.esc');

    expect(wrapper.emitted()['update:modelValue']).toBeFalsy();
    expect(wrapper.emitted()['cancel']).toBeTruthy();
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('Original Escape');
  });

  it('displays placeholder when modelValue is empty', () => {
    const wrapper = factory({ modelValue: '', placeholder: 'My Placeholder' });
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('My Placeholder');
  });

  it('does not save if value has not changed', async () => {
    const wrapper = factory({ modelValue: 'No Change' });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');
    await wrapper.find('[data-testid="save-button"]').trigger('click');

    expect(wrapper.emitted()['update:modelValue']).toBeFalsy(); // No change, so no emit
    expect(wrapper.emitted()['save']).toBeFalsy(); // No save event either
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false); // Still switches back
  });

  it('updates internal value if modelValue prop changes while not editing', async () => {
    const wrapper = factory({ modelValue: 'Initial' });
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('Initial');

    await wrapper.setProps({ modelValue: 'Updated Externally' });
    expect(wrapper.find('[data-testid="editable-text-display"]').text()).toContain('Updated Externally');

    // Ensure internal value is also updated for next edit session
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');
    expect(wrapper.find('[data-testid="editable-textfield"]').find('input').element.value).toBe('Updated Externally');
  });

  it('does not update internal value if modelValue prop changes while editing', async () => {
    const wrapper = factory({ modelValue: 'Initial Edit' });
    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');

    const inputElement = wrapper.find('[data-testid="editable-textfield"]').find('input');
    await inputElement.setValue('User is typing'); // User changes value

    await wrapper.setProps({ modelValue: 'External change during edit' }); // Prop changes externally

    // Internal value should remain what the user typed, not the external change
    expect(wrapper.find('[data-testid="editable-textfield"]').find('input').element.value).toBe('User is typing');
  });

  it('hides actions buttons if showActions is false and saves on blur', async () => {
    const wrapper = factory({ modelValue: 'Blur Save', showActions: false });
    expect(wrapper.find('[data-testid="save-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(false);

    await wrapper.find('[data-testid="editable-text-display"]').trigger('click');
    const textField = wrapper.findComponent({ ref: 'inputRef' }); // Access component via ref
    await textField.setValue('New blur value'); // Set value on the input component

    // Simulate blur. For v-text-field, it might be on the input element itself.
    // Need to ensure the component's internal blur handler that calls saveAndStopEditing is triggered.
    // Directly calling the method might be an option if DOM events are tricky.
    // Or, find the input and trigger blur on it.
    await textField.find('input').trigger('blur');

    expect(wrapper.emitted()['update:modelValue']).toBeTruthy();
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['New blur value']);
    expect(wrapper.find('[data-testid="editable-textfield"]').exists()).toBe(false);
  });

});
