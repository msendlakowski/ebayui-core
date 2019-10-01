const assign = require('core-js-pure/features/object/assign');
const rovingTabindex = require('makeup-roving-tabindex');
const eventUtils = require('../../common/event-utils');

module.exports = require('marko-widgets').defineComponent({
    template: require('./template.marko'),
    getInitialProps(input) {
        return assign({
            activation: 'auto',
            headings: [],
            panels: []
        }, input);
    },
    getInitialState(input) {
        return assign({}, input, {
            index: (parseInt(input.index, 10) || 0) % (input.headings.length || 1)
        });
    },
    init() {
        if (!this.state.fake) {
            const linearRovingTabindex = rovingTabindex.createLinear(
                this.getEl('headings'),
                '.tabs__item',
                { index: this.state.index }
            );

            linearRovingTabindex.wrap = true;
        }
    },
    /**
     * Handle a11y for heading
     * https://ebay.gitbooks.io/mindpatterns/content/disclosure/tabs.html
     * @param {KeyboardEvent} event
     * @param {HTMLDivElement} el
     */
    handleHeadingKeydown(event, el) {
        eventUtils.handleActionKeydown(event, () => {
            event.preventDefault();
            this.setIndex(el.dataset.index);
        });

        eventUtils.handleArrowsKeydown(event, () => {
            event.preventDefault();

            const len = this.state.headings.length;
            const keyCode = event.charCode || event.keyCode;
            const direction = keyCode === 37 || keyCode === 38 ? -1 : 1;
            const index = (this.state.index + len + direction) % len;
            this.getEl(`tab-${index}`).focus();

            if (this.state.activation === 'auto') {
                this.setIndex(index);
            }
        });
    },
    handleHeadingClick(_, el) {
        this.setIndex(el.dataset.index);
    },
    setIndex(rawIndex) {
        const len = this.state.headings.length;
        const index = ((parseInt(rawIndex, 10) || 0) + len) % len;

        if (index !== this.state.index) {
            this.setState('index', index);
            this.emit('tab-select', { index });
        }
    }
});
