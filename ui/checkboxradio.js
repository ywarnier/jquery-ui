/*!
 * jQuery UI Checkboxradio @VERSION
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 * http://api.jqueryui.com/checkboxradio/
 */
( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [
			"jquery",
			"./core",
			"./widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

var formResetHandler = function() {
		var form = $( this );

		// Wait for the form reset to actually happen before refreshing
		setTimeout( function() {

			// We dont filter for css only versions since css only is not supported
			form.find( ".ui-checkboxradio" ).checkboxradio( "refresh" );
		} );
	},
	escapeId = new RegExp( /([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g ),
	forms = {};

$.widget( "ui.checkboxradio", {
	version: "@VERSION",
	options: {
		disabled: null,
		label: null,
		icon: true,
		classes: {
			"ui-checkboxradio-label": "ui-corner-all",
			"ui-checkboxradio-icon": "ui-corner-all"
		}
	},

	_getCreateOptions: function() {
		var disabled,
			that = this,
			options = this._super() || {};

		// We read the type here, because it makes more sense to throw a element type error first,
		// rather then the error for lack of a label. Often if its the wrong type, it
		// won't have a label (e.g. calling on a div, btn, etc)
		this._readType();
		this._findLabel();

		this.originalLabel = "";

		// We need to get the label text but this may also need to make sure it does not contain the
		// input itself.
		this.label.contents().not( this.element ).each( function() {

			// The label contents could be text html or a mix we concat each element to get a string
			// representation of the label without the input as part of it.
			that.originalLabel += this.nodeType === 3 ? $( this ).text() : this.outerHTML;
		} );

		// Set the label option if we found label text
		if ( this.originalLabel ) {
			options.label = this.originalLabel;
		}

		disabled = this.element[ 0 ].disabled;
		if ( disabled != null ) {
			options.disabled = disabled;
		}
		return options;
	},

	_create: function() {
		this.formElement = $( this.element[ 0 ].form ).uniqueId();
		this.formId = this.formElement.attr( "id" );

		forms[ this.formId ] = forms[ this.formId ] || 0;

		// We don't use _on and _off here because we want all the checkboxes in the same form to use
		// single handler which handles all the checkboxradio widgets in the form
		if ( forms[ this.formId ] === 0 ) {
			this.formElement.on( "reset." + this.widgetFullName, formResetHandler );
		}
		forms[ this.formId ]++;

		if ( this.options.disabled == null ) {
			this.options.disabled = this.element[ 0 ].disabled || false;
		}

		this._enhance();

		this._on( {
			"change": "_toggleClasses",
			"focus": function() {
				this._addClass( this.label, null, "ui-state-focus ui-visual-focus" );
			},
			"blur": function() {
				this._removeClass( this.label, null, "ui-state-focus ui-visual-focus" );
			}
		} );
	},

	_findLabel: function() {
		var ancestor, labelSelector, id,
			parent = this.element.closest( "label" );

		// Check control.labels first
		if ( this.element[ 0 ].labels !== undefined && this.element[ 0 ].labels.length > 0 ) {
			this.label = $( this.element[ 0 ].labels[ 0 ] );
		} else {
			parent = this.element.closest( "label" );

			if ( parent.length > 0 ) {
				this.label = parent;
				this.parentLabel = true;
				return;
			}

			// We don't search against the document in case the element
			// is disconnected from the DOM
			ancestor = this.element.parents().last();

			// Look for the label based on the id
			id = this.element.attr( "id" );
			if ( id ) {
				labelSelector = "label[for='" +
					this.element.attr( "id" ).replace( escapeId, "\\$1" ) + "']";
				this.label = ancestor.find( labelSelector );

				if ( !this.label.length ) {

					// The label was not found, make sure ancestors exist. If they do check their
					// siblings, if they dont check the elements siblings
					ancestor = ancestor.length ? ancestor.siblings() : this.element.siblings();

					// Check if any of the new set of ancestors is the label
					this.label = ancestor.filter( labelSelector );
					if ( !this.label.length ) {

						// Still not found look inside the ancestors for the label
						this.label = ancestor.find( labelSelector );
					}
				}
			}
			if ( !this.label || !this.label.length ) {
				$.error( "No label found for checkboxradio widget" );
			}
		}
	},

	_readType: function() {
		var nodeName = this.element[ 0 ].nodeName.toLowerCase();
		this.type = this.element[ 0 ].type;
		if ( nodeName !== "input" || !/radio|checkbox/.test( this.type ) ) {
			$.error( "Can't create checkboxradio on element.nodeName=" + nodeName +
				" and element.type=" + this.type );
		}
	},

	_enhance: function() {
		var checked = this.element[ 0 ].checked;

		this._setOption( "disabled", this.options.disabled );
		this._updateIcon( checked );
		this._addClass( "ui-checkboxradio", "ui-helper-hidden-accessible" );
		this._addClass( this.label, "ui-checkboxradio-label", "ui-button ui-widget" );

		if ( this.type === "radio" ) {
			this._addClass( this.label, "ui-checkboxradio-radio-label" );
		}
		if ( checked ) {
			this._addClass( this.label, "ui-checkboxradio-checked", "ui-state-active" );
			this._addClass( this.icon, null, "ui-state-hover" );
		}
		if ( this.options.label && this.options.label !== this.originalLabel ) {
			this.label.html( this.icon ? this.icon : "" ).append( this.options.label );
		} else if ( this.originalLabel ) {
			this.options.label = this.originalLabel;
		}
	},

	widget: function() {
		return this.label;
	},

	_getRadioGroup: function() {
		var name = this.element[ 0 ].name,
			form = this.element[ 0 ].form,
			radios = $( [] );
		if ( name ) {
			name = name.replace( escapeId, "\\$1" );
			if ( form ) {
				radios = $( form ).find( "[name='" + name + "']" );
			} else {
				radios = this.document.find( "[name='" + name + "']" )
					.filter( function() {
						return !this.form;
					} );
			}
		}
		return radios.not( this.element );
	},

	_toggleClasses: function() {
		var checked = this.element[ 0 ].checked;
		this._toggleClass( this.label, "ui-checkboxradio-checked", "ui-state-active", checked );

		if ( this.options.icon && this.type === "checkbox" ) {

			// We add ui-state-highlight to change the icon color
			this._toggleClass( this.icon, null, "ui-icon-check ui-state-highlight", checked )
				._toggleClass( this.icon, null, "ui-icon-blank", !checked );
		}
		if ( this.type === "radio" ) {
			this._getRadioGroup()
				.each( function() {
					var instance = $( this ).checkboxradio( "instance" );

					if ( instance ) {
						instance._removeClass( instance.label,
							"ui-checkboxradio-checked", "ui-state-active" );
					}
				} );
		}
	},

	_destroy: function() {
		if ( this.icon ) {
			this.icon.remove();
			this.iconSpace.remove();
		}

		forms[ this.formId ]--;
		if ( forms[ this.formId ] === 0 ) {
			this.formElement.off( "reset." + this.widgetFullName, formResetHandler );
		}
	},

	_setOption: function( key, value ) {

		// We don't alow the value to be set to nothing
		if ( key === "label" && !value ) {
			return;
		}

		this._super( key, value );

		if ( key === "disabled" ) {
			this._toggleClass( this.label, null, "ui-state-disabled", value );
			this.element[ 0 ].disabled = value;

			// Don't refresh if disabled
			return;
		}
		this.refresh();
	},

	_updateIcon: function( checked ) {
		var toAdd = "ui-icon ui-icon-background ";

		if ( this.options.icon ) {
			if ( !this.icon ) {
				this.icon = $( "<span>" );
				this.iconSpace = $( "<span> </span>" );
			}

			if ( this.type === "checkbox" ) {
				toAdd += checked ? "ui-icon-check" : "ui-icon-blank";
				this._removeClass( this.icon, null, checked ? "ui-icon-blank" : "ui-icon-check" );
			} else {
				toAdd += "ui-icon-blank";
			}
			this._addClass( this.icon, "ui-checkboxradio-icon", toAdd );
			if ( !checked ) {
				this._removeClass( this.icon, null, "ui-icon-check" );
			}
			this.icon.prependTo( this.label ).after( this.iconSpace );
		} else if ( this.icon !== undefined ) {
			this.icon.remove();
			this.iconSpace.remove();
			delete this.icon;
		}
	},

	refresh: function() {
		var checked = this.element[ 0 ].checked,
			isDisabled = this.element[ 0 ].disabled;

		this._updateIcon( checked );
		this._toggleClass( this.label, "ui-checkboxradio-checked", "ui-state-active", checked );
		if ( this.options.label !== null ) {

			// Remove the contents of the label ( minus the icon, icon space, and input )
			this.label.contents().not( this.element.add( this.icon ).add( this.iconSpace ) ).remove();
			this.label.append( this.options.label );

		}

		if ( isDisabled !== this.options.disabled ) {
			this._setOptions( { "disabled": isDisabled } );
		}
	}

} );

return $.ui.checkboxradio;

} ) );