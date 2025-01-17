const Expander = require('makeup-expander');
const assign = require('core-js-pure/features/object/assign');
const indexOf = require('core-js-pure/features/array/index-of');
const findIndex = require('core-js-pure/features/array/find-index');
const eventUtils = require('../../common/event-utils');
const template = require('./template.marko');

module.exports = require('marko-widgets').defineComponent({
    template,
    getInitialState(input) {
        return assign({}, input, {
            items: (input.items || []).map(item => assign({}, item))
        });
    },
    onRender() {
        this.expander = new Expander(this.el, {
            hostSelector: '.menu-button__button, .fake-menu-button__button',
            contentSelector: '.menu-button__menu, .fake-menu-button__menu',
            focusManagement: 'focusable',
            expandOnClick: true,
            autoCollapse: true,
            alwaysDoFocusManagement: true
        });
    },
    onBeforeUpdate() {
        this._handleDestroy();
    },
    onDestroy() {
        this._handleDestroy();
    },
    _handleDestroy() {
        this.expander.cancelAsync();
    },
    toggleItemChecked(itemEl) {
        const itemIndex = indexOf(itemEl.parentNode.children, itemEl);
        const item = this.state.items[itemIndex];
        const currentIndex = this.state.items.findIndex(radioItem => radioItem.checked);

        if (this.state.type === 'radio' && itemIndex !== currentIndex) {
            this.state.items.forEach((eachItem, i) => {
                eachItem.checked = i === itemIndex;
            });

            this.setStateDirty('items');
            this.emitComponentEvent({
                eventType: 'change',
                el: itemEl
            });
        } else if (this.state.type !== 'radio') {
            item.checked = !item.checked;
            this.setStateDirty('items');
            this.emitComponentEvent({
                eventType: this.state.type === 'fake' || !this.state.type ? 'select' : 'change',
                el: itemEl
            });
        }

        if (this.rovingTabindex) {
            this.tabindexPosition = findIndex(this.rovingTabindex.filteredItems, el => el.tabIndex === 0);
        }
    },
    getCheckedValues() {
        return this.state.items
            .filter(item => item.checked)
            .map(item => item.value);
    },
    getCheckedIndexes() {
        return this.state.items
            .map((item, i) => item.checked && i)
            .filter(item => item !== false && typeof item !== 'undefined');
    },
    handleItemClick(e, itemEl) {
        this.toggleItemChecked(itemEl);
    },
    handleMenuKeydown({ el, originalEvent }) {
        eventUtils.handleActionKeydown(originalEvent, () => {
            this.handleItemClick(originalEvent, el);
        });

        eventUtils.handleEscapeKeydown(originalEvent, () => {
            this.expander.collapse();
            this.getEl('button').focus();
        });
    },
    handleButtonEscape() {
        this.expander.collapse();
    },
    handleExpand() {
        this.emitComponentEvent({ eventType: 'expand' });
    },
    handleCollapse() {
        this.emitComponentEvent({ eventType: 'collapse' });
    },
    handleMenuChange({ el }) {
        this.toggleItemChecked(el);
    },
    handleMenuSelect({ el, originalEvent }) {
        this.emitComponentEvent({ eventType: 'select', el, originalEvent });
    },
    emitComponentEvent({ eventType, el, originalEvent }) {
        const checkedIndexes = this.getCheckedIndexes();
        const itemIndex = el && indexOf(el.parentNode.children, el);
        const isCheckbox = this.state.type === 'checkbox';
        const isRadio = this.state.type === 'radio';

        const eventObj = {
            el,
            originalEvent
        };

        if (isCheckbox && checkedIndexes.length > 1) {
            assign(eventObj, {
                indexes: this.getCheckedIndexes(), // DEPRECATED in v5
                checked: this.getCheckedIndexes(), // DEPRECATED in v5 (keep but change from indexes to values)
                checkedValues: this.getCheckedValues() // DEPRECATED in v5
            });
        } else if (isCheckbox || isRadio) {
            assign(eventObj, {
                index: itemIndex, // DEPRECATED in v5
                checked: this.getCheckedIndexes(), // DEPRECATED in v5 (keep but change from indexes to values)
                checkedValues: this.getCheckedValues() // DEPRECATED in v5
            });
        } else if (eventType !== 'expand' && eventType !== 'collapse') {
            assign(eventObj, {
                index: itemIndex, // DEPRECATED in v5
                checked: [itemIndex] // DEPRECATED in v5 (keep but change from indexes to values)
            });
        }

        this.emit(`menu-button-${eventType}`, eventObj);
    }
});
