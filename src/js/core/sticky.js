import { Class } from '../mixin/index';
import { $, Animation, isNumeric, isString, offsetTop, query, requestAnimationFrame } from '../util/index';

export default function (UIkit) {

    UIkit.component('sticky', {

        mixins: [Class],

        attrs: true,

        props: {
            top: null,
            bottom: Boolean,
            offset: Number,
            animation: String,
            clsActive: String,
            clsInactive: String,
            clsFixed: String,
            clsBelow: String,
            widthElement: 'jQuery',
            showOnUp: Boolean,
            media: 'media',
            target: Number
        },

        defaults: {
            top: 0,
            bottom: false,
            offset: 0,
            animation: '',
            clsActive: 'uk-active',
            clsInactive: '',
            clsFixed: 'uk-sticky-fixed',
            clsBelow: 'uk-sticky-below',
            widthElement: false,
            showOnUp: false,
            media: false,
            target: false
        },

        connected() {

            this.placeholder = $('<div class="uk-sticky-placeholder"></div>');
            this.widthElement = this.$props.widthElement || this.placeholder;

            if (!this.isActive) {
                this.$addClass(this.clsInactive);
            }
        },

        disconnected() {

            if (this.isActive) {
                this.isActive = false;
                this.hide();
                this.$removeClass(this.clsInactive);
            }

            this.placeholder.remove();
            this.placeholder = null;
            this.widthElement = null;
        },

        ready() {

            if (!(this.target && location.hash && window.pageYOffset > 0)) {
                return;
            }

            var target = query(location.hash);

            if (target) {
                requestAnimationFrame(() => {

                    var top = offsetTop(target),
                        elTop = offsetTop(this.$el),
                        elHeight = this.$el[0].offsetHeight;

                    if (elTop + elHeight >= top && elTop <= top + target[0].offsetHeight) {
                        window.scrollTo(0, top - elHeight - this.target - this.offset);
                    }

                });
            }

        },

        update: [

            {

                write() {

                    var outerHeight = (this.isActive ? this.placeholder : this.$el)[0].offsetHeight, el;

                    this.placeholder
                        .css('height', this.$el.css('position') !== 'absolute' ? outerHeight : '')
                        .css(this.$el.css(['marginTop', 'marginBottom', 'marginLeft', 'marginRight']));

                    if (!document.documentElement.contains(this.placeholder[0])) {
                        this.placeholder.insertAfter(this.$el).attr('hidden', true);
                    }

                    this.width = this.widthElement.attr('hidden', null)[0].offsetWidth;
                    this.widthElement.attr('hidden', !this.isActive);

                    this.topOffset = offsetTop(this.isActive ? this.placeholder : this.$el);
                    this.bottomOffset = this.topOffset + outerHeight;

                    ['top', 'bottom'].forEach(prop => {

                        this[prop] = this.$props[prop];

                        if (!this[prop]) {
                            return;
                        }

                        if (isNumeric(this[prop])) {

                            this[prop] = this[`${prop}Offset`] + parseFloat(this[prop]);

                        } else {

                            if (isString(this[prop]) && this[prop].match(/^-?\d+vh$/)) {
                                this[prop] = window.innerHeight * parseFloat(this[prop]) / 100;
                            } else {

                                el = this[prop] === true ? this.$el.parent() : query(this[prop], this.$el);

                                if (el) {
                                    this[prop] = offsetTop(el) + el[0].offsetHeight;
                                }

                            }

                        }

                    });

                    this.top = Math.max(parseFloat(this.top), this.topOffset) - this.offset;
                    this.bottom = this.bottom && this.bottom - outerHeight;
                    this.inactive = this.media && !window.matchMedia(this.media).matches;

                    if (this.isActive) {
                        this.update();
                    }
                },

                events: ['load', 'resize']

            },

            {

                read() {
                    this.offsetTop = offsetTop(this.$el);
                    this.scroll = window.pageYOffset;
                    this.visible = this.$el.is(':visible');
                },

                write({dir} = {}) {

                    var scroll = this.scroll;

                    if (scroll < 0 || !this.visible || this.disabled || this.showOnUp && !dir) {
                        return;
                    }

                    if (this.inactive
                        || scroll < this.top
                        || this.showOnUp && (scroll <= this.top || dir ==='down' || dir === 'up' && !this.isActive && scroll <= this.bottomOffset)
                    ) {

                        if (!this.isActive) {
                            return;
                        }

                        this.isActive = false;

                        if (this.animation && scroll > this.topOffset) {
                            Animation.cancel(this.$el).then(() => Animation.out(this.$el, this.animation).then(() => this.hide()));
                        } else {
                            this.hide();
                        }

                    } else if (this.isActive) {

                        this.update();

                    } else if (this.animation) {

                        Animation.cancel(this.$el).then(() => {
                            this.show();
                            Animation.in(this.$el, this.animation);
                        });

                    } else {
                        this.show();
                    }

                },

                events: ['scroll']

            },

        ],

        methods: {

            show() {

                this.isActive = true;
                this.update();
                this.$el.trigger('active');
                this.placeholder.attr('hidden', null);

            },

            hide() {

                this.$addClass(this.clsInactive);
                this.$removeClass(this.clsFixed, this.clsActive, this.clsBelow);
                this.$el.css({position: '', top: '', width: ''}).trigger('inactive');
                this.placeholder.attr('hidden', true);

            },

            update() {

                var top = Math.max(0, this.offset), active = this.scroll > this.top;

                if (this.bottom && this.scroll > this.bottom - this.offset) {
                    top = this.bottom - this.scroll;
                }

                this.$el.css({
                    position: 'fixed',
                    top: `${top}px`,
                    width: this.width
                });

                this.$addClass(this.clsFixed);
                this.$toggleClass(this.clsActive, active);
                this.$toggleClass(this.clsInactive, !active);
                this.$toggleClass(this.clsBelow, this.scroll > this.bottomOffset);

            }

        }

    });

}
