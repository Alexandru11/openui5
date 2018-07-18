/*global QUnit, sinon, jQuery */
(function() {
	"use strict";

	QUnit.config.autostart = false;

	sap.ui.require([
		"sap/ui/qunit/QUnitUtils",
		"sap/ui/core/Icon",
		"sap/m/ViewSettingsPopover",
		"sap/ui/Device",
		"sap/ui/model/json/JSONModel",
		"sap/m/ViewSettingsItem",
		"sap/m/ViewSettingsFilterItem",
		"sap/m/Button",
		"sap/m/library",
		"sap/m/TabStripItem",
		"sap/m/ViewSettingsCustomTab",
		"sap/m/Label"
	], function(qutils, Icon, ViewSettingsPopover, Device, JSONModel, ViewSettingsItem, ViewSettingsFilterItem, Button, library, TabStripItem, ViewSettingsCustomTab, Label) {

		sinon.config.useFakeTimers = true;

		var PAGE_KEYS = {
			Sort: 'sort',
			Filter: 'filter',
			FilterDetail: 'filterDetail',
			Group: 'group'
		};

		function createItems(sPageKey, itemNum) {
			var aResultItems = [];

			for (var i = 0; i < itemNum; i++) {
				aResultItems.push(new ViewSettingsItem({
					key: sPageKey + i,
					text: sPageKey + " item " + i
				}));
			}

			return aResultItems;
		}

		function createFilterItems() {
			return [
				new ViewSettingsFilterItem({
					key: "filter0",
					text: "filter item 0",
					items: [
						new ViewSettingsItem({
							key: "filter0-sub0",
							text: "Apple"
						}),
						new ViewSettingsItem({
							key: "filter0-sub1",
							text: "Apricot"
						}),
						new ViewSettingsItem({
							key: "filter0-sub2",
							text: "Banana"
						})
					]
				}),
				new ViewSettingsFilterItem({
					key: "filter1",
					text: "filter item 1"
				}),
				new ViewSettingsFilterItem({
					key: "filter2",
					text: "filter item 2",
					items: [
						new ViewSettingsItem({
							key: "filter2-sub0",
							text: "filter item 2 sub 0"
						})
					]
				})
			];
		}

		function createControls(aPageKeys) {
			var sAggregationNameSuffixItems = "Items",
				oVSPSettings = {};

			aPageKeys.forEach(function(key) {
				if (key === 'filter') {
					oVSPSettings[key + sAggregationNameSuffixItems] = createFilterItems();
				} else {
					oVSPSettings[key + sAggregationNameSuffixItems] = createItems(key, 3);
				}
			});

			this.sut = new ViewSettingsPopover(oVSPSettings);

			this.oOpeningButton = new Button();
			this.oOpeningButton.placeAt("qunit-fixture");

			sap.ui.getCore().applyChanges();
		}

		function destroyControls() {
			this.sut.destroy();
			this.sut = null;

			this.oOpeningButton.destroy();
			this.oOpeningButton = null;
		}

		function prepareMobilePlatform() {
			var oSystem = {
				desktop : false,
				phone : true,
				tablet : false
			};

			this.sandbox = sinon.sandbox;
			this.sandbox.stub(Device, "system", oSystem);
			this.sandbox.stub(jQuery.device, "is", oSystem);

			jQuery('#qunit-fixture').addClass('sap-phone');
			jQuery('body').addClass('sap-phone');
		}

		function restoreFromMobilePlatform() {
			jQuery('#qunit-fixture').removeClass('sap-phone');
			jQuery('body').removeClass('sap-phone');

			this.sandbox.restore();
			this.sandbox = null;
		}


		if (Device.system.desktop || Device.system.combi) {

			QUnit.module("Basics one page", {
				beforeEach: function () {
					createControls.call(this, [PAGE_KEYS.Sort]);
				},
				afterEach: function () {
					destroyControls.call(this);
				}
			});

			QUnit.test("opening, closing and reopening", function (assert) {
				assert.strictEqual(this.sut.isOpen(), false, 'Popup is closed');

				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert

				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Act
				this.sut.close();
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), false, 'Popup is closed');

				//Act
				this.sut.toggle(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Act
				this.sut.toggle(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), false, 'Popup is closed');
			});

			QUnit.test("popover resizing", function (assert) {
				var initialWidth;

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				initialWidth = this.sut._getPopover().getContentWidth();
				this.sut._getSegmentedButton().getItems()[0].firePress();
				this.clock.tick(1000);

				//Check
				assert.ok(initialWidth != this.sut._getPopover().getContentWidth(), "Popover width is changed");

				//Act
				this.sut._getSegmentedButton().getItems()[0].firePress();
				this.clock.tick(1000);

				//Check
				assert.ok(initialWidth == this.sut._getPopover().getContentWidth(), "Popover width is back to initial state");
			});

			QUnit.test("segmented button", function(assert) {
				var oSegmentedButton,
					oSegmentedButtonItems;

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				oSegmentedButton = this.sut._getSegmentedButton();
				oSegmentedButtonItems = oSegmentedButton.getItems();

				//Assert
				assert.ok(oSegmentedButton, 'is created');
				assert.ok(oSegmentedButton.getDomRef(), "is rendered");
				assert.strictEqual(oSegmentedButtonItems.length, 1, "has only one button");
				assert.strictEqual(oSegmentedButtonItems[0].getKey(), PAGE_KEYS.Sort, "is the right button");
			});

			QUnit.test("segmented button adding/removing items", function(assert) {
				var oSegmentedButton,
					oSegmentedButtonItems;

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.sut.addFilterItem(new ViewSettingsFilterItem({
					key: "filter0",
					text: "filter item 0"
				}));

				oSegmentedButton = this.sut._getSegmentedButton();
				oSegmentedButtonItems = oSegmentedButton.getItems();

				//Assert
				assert.strictEqual(oSegmentedButtonItems.length, 2, "button is added");
				assert.strictEqual(oSegmentedButtonItems[1].getKey(), PAGE_KEYS.Filter, "the right button is added");

				//Act
				this.sut.destroyFilterItems();
				this.clock.tick(1000);

				oSegmentedButtonItems = oSegmentedButton.getItems();

				//Assert
				assert.strictEqual(oSegmentedButtonItems.length, 1, "button is removed");
				assert.strictEqual(oSegmentedButtonItems[0].getKey(), PAGE_KEYS.Sort, "the right button is removed");
			});

			QUnit.module("Basics three pages", {
				beforeEach: function () {
					createControls.call(this, [PAGE_KEYS.Sort, PAGE_KEYS.Filter, PAGE_KEYS.Group]);
				},
				afterEach: function () {
					destroyControls.call(this);
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				}
			});

			QUnit.test("page title", function(assert) {
				var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.m");

				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Sort);

				//Assert
				assert.strictEqual(this.sut._getMainPage().getHeaderContent().length, 0, "no page title is rendered for the 'Sort' page");

				//Act
				this.sut._showContentFor(PAGE_KEYS.Filter);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getMainPage().getHeaderContent().length, 0, "no page title is rendered for the 'Filter' page");

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				//Assert
				var oPopoverAriaLabelledByText = sap.ui.getCore().byId(this.sut._getPopoverAriaLabel()).getText();

				assert.strictEqual(this.sut._getDetailsPage().getHeaderContent()[0].getContentMiddle()[0].getText(), this.sut.getFilterItems()[0].getText(), "for the filter sub page we have title rendered and its text is correct");
				assert.strictEqual(oPopoverAriaLabelledByText, oResourceBundle.getText("VIEWSETTINGS_TITLE_FILTERBY") + this.sut.getFilterItems()[0].getText(), "for the filter sub page we have correct Aria title text");
			});

			QUnit.test("no list inside on open", function(assert) {
				var bContentHasSortListInside,
					fnIsSortList = function(oControl) {
						return oControl.getId() === this.sut._getSortList().getId();
					};

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				bContentHasSortListInside = this.sut
						._getMainPage().getContent().some(fnIsSortList, this);

				//Assert
				assert.ok(!bContentHasSortListInside, "no sort list inside");

				//Act
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);

				bContentHasSortListInside = this.sut._getMainPage().getContent().some(fnIsSortList, this);

				//Assert
				assert.ok(bContentHasSortListInside, "sort list inside");
				assert.ok(this.sut._getSortList().getDomRef(), "sort list is rendered");
			});

			QUnit.test("no list inside after close and reopen", function(assert) {
				var bContentHasSortListInside,
					fnIsSortList = function(oControl) {
						return oControl.getId() === this.sut._getSortList().getId();
					};

				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);
				this.sut.close();
				this.clock.tick(1000);
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				bContentHasSortListInside = this.sut
						._getMainPage().getContent().some(fnIsSortList, this);

				//Assert
				assert.ok(!bContentHasSortListInside, "no sort list inside");
			});

			QUnit.test("correct list inside on segmented button change selected button", function(assert) {
				var bContentHasSortListInside,
						bContentHasFilterListInside,
						fnIsSortList = function(oControl) {
							return oControl.getId() === this.sut._getSortList().getId();
						},
						fnIsFilterList = function(oControl) {
							return oControl.getId() === this.sut._getFilterList().getId();
						};

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Filter);
				this.clock.tick(1000);

				bContentHasSortListInside = this.sut
						._getMainPage().getContent().some(fnIsSortList, this);
				bContentHasFilterListInside = this.sut
						._getMainPage().getContent().some(fnIsFilterList, this);

				//Assert
				assert.ok(!bContentHasSortListInside, "no sort list inside");
				assert.ok(bContentHasFilterListInside, "filter list inside");
				assert.ok(this.sut._getFilterList().getDomRef(), "filter list is rendered");
			});

			QUnit.test("fireSortSelected on already selected item", function(assert) {
				var oSortList = this.sut._getSortList(),
					oFirstSortItem = this.sut.getSortItems()[0],
					oSpyFireSortSelected = this.spy(this.sut, "fireSortSelected");

				// set first item to be selected iniatilly
				oFirstSortItem.setSelected(true);

				this.sut.openBy(this.oOpeningButton);
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);

				// focus list, the first item in the sort list will be focused and press enter
				oSortList.focus();
				qutils.triggerKeydown(document.activeElement, "ENTER");
				this.clock.tick(1000);

				//Assert
				assert.ok(!this.sut.isOpen(), "popover is closed");
				assert.strictEqual(oSpyFireSortSelected.callCount, 1, "event sortSelected fired exactly once");
				assert.ok(oSpyFireSortSelected.args[0].length, "fired with arguments");
				assert.ok(oSpyFireSortSelected.args[0][0].items, "arg contains 'items' key");
				assert.strictEqual(oSpyFireSortSelected.args[0][0].items.length, 1, "arg contains the right number of items");
				assert.strictEqual(oSpyFireSortSelected.args[0][0].items[0].getId(), oFirstSortItem.getId(), "arg contains the right items");
			});

			QUnit.test("fireGroupSelected on already selected item", function(assert) {
				var oGroupList = this.sut._getGroupList(),
					oFirstGroupItem = this.sut.getGroupItems()[0],
					oSpyFireGroupSelected = this.spy(this.sut, "fireGroupSelected");

				// set first item to be selected iniatilly
				oFirstGroupItem.setSelected(true);

				this.sut.openBy(this.oOpeningButton);
				this.sut._showContentFor(PAGE_KEYS.Group);
				this.clock.tick(1000);

				// focus list, the first item in the group list will be focused and press enter
				oGroupList.focus();
				qutils.triggerKeydown(document.activeElement, "ENTER");
				this.clock.tick(1000);

				//Assert
				assert.ok(!this.sut.isOpen(), "popover is closed");
				assert.strictEqual(oSpyFireGroupSelected.callCount, 1, "event sortSelected fired exactly once");
				assert.ok(oSpyFireGroupSelected.args[0].length, "fired with arguments");
				assert.ok(oSpyFireGroupSelected.args[0][0].items, "arg contains 'items' key");
				assert.strictEqual(oSpyFireGroupSelected.args[0][0].items.length, 1, "arg contains the right number of items");
				assert.strictEqual(oSpyFireGroupSelected.args[0][0].items[0].getId(), oFirstGroupItem.getId(), "arg contains the right items");
			});

			QUnit.module("Details page", {
				beforeEach: function () {
					createControls.call(this, [PAGE_KEYS.Sort, PAGE_KEYS.Filter]);
				},
				afterEach: function () {
					destroyControls.call(this);
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				},
				checkToggleDetailListItemAt: function (index, isChecked) {
					var oListItem = this.sut._getFilterDetailList().getItems()[index],
						oVSItem = this.sut._findViewSettingsItemFromListItem(oListItem);

					oVSItem.setSelected(isChecked);
				}
			});

			QUnit.test("Removing filter detail items does not throw error", function(assert) {
				//prepare
				var oVSP = new ViewSettingsPopover();
				try {
					//act
					oVSP.removeAllFilterDetailItems();
					//assert
					assert.ok(true, "Should not throw an error");
				} catch (e) {
					assert.ok(false, "Should not throw an error. Details:\n " + e.stack);
				}
				//cleanup
				oVSP.destroy();
			});
			QUnit.test("detail page opens and loads proper content", function(assert) {
				var oDetailsPage,
					oPageToolbar,
					oListToolbar;

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				oDetailsPage = this.sut._getDetailsPage();

				//Assert
				assert.strictEqual(this.sut._getNavContainer().getCurrentPage().getId(),
						this.sut._getDetailsPageId(), "opened");
				assert.strictEqual(oDetailsPage.getContent().length, 2, "contains a toolbar and a list");
				assert.strictEqual(oDetailsPage.getContent()[1].getId(),
						this.sut._getFilterDetailList().getId(), "contains the filter details list");

				oPageToolbar = oDetailsPage.getContent()[0];
				oListToolbar = oDetailsPage.getContent()[1].getHeaderToolbar();

				//Assert
				assert.strictEqual(oPageToolbar.getContent()[0].getId(),
						this.sut._getSearchField().getId(), "contains a search field");
				assert.strictEqual(oListToolbar.getContent()[0].getId(),
						this.sut._getSelectAllCheckbox().getId(), "contains a select all checkbox");
			});

			QUnit.test("detail page for single select item opens and loads proper content", function(assert) {
				var fnIsSearchField = function(oControl) {
						return oControl.getId() === this.sut._getSearchField().getId();
					},
					fnIsSelectAllCheckbox = function(oControl) {
						return oControl.getId() === this.sut._getSelectAllCheckbox().getId();
					},
					bContentHasSearchFieldInside,
					bContentHasSelectAllCheckInside;

				this.sut.getFilterItems()[0].setMultiSelect(false);

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				bContentHasSearchFieldInside = this.sut._getDetailsPage().getContent().some(fnIsSearchField, this);
				bContentHasSelectAllCheckInside = this.sut._getDetailsPage().getContent().some(fnIsSelectAllCheckbox, this);

				//Assert
				assert.ok(!bContentHasSearchFieldInside, "does not contain a search field");
				assert.ok(!bContentHasSelectAllCheckInside, "does not contain a select all checkbox");
				assert.strictEqual(this.sut._getFilterDetailList().getMode(), library.ListMode.SingleSelectLeft, "list is in single select mode");
			});

			QUnit.test("select all checkbox works correctly", function(assert) {
				var aFirstFilterItemSubItems = this.sut.getFilterItems()[0].getItems(),
					oSelectAllCheckbox,
					bAllSelected,
					bNoItemsSelected,
					fnIsItemSelected = function(oItem) {
						return oItem.getSelected();
					};

				aFirstFilterItemSubItems[0].setSelected(true);

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				oSelectAllCheckbox = this.sut._getSelectAllCheckbox();
				bAllSelected = this.sut._getFilterDetailList().getItems().every(fnIsItemSelected, this);

				//Assert
				assert.ok(!bAllSelected, "not all list items are selected at first");

				//Act
				oSelectAllCheckbox.setSelected(true);
				oSelectAllCheckbox.fireSelect({ selected: true });

				bAllSelected = this.sut._getFilterDetailList().getItems().every(fnIsItemSelected, this);

				//Assert
				assert.ok(bAllSelected, "after check select all - all list items are selected");

				//Act
				oSelectAllCheckbox.setSelected(false);
				oSelectAllCheckbox.fireSelect({ selected: false });

				bNoItemsSelected = !this.sut._getFilterDetailList().getItems().some(fnIsItemSelected, this);

				//Assert
				assert.ok(bNoItemsSelected, "after uncheck select all - no items are selected");
			});

			QUnit.test("query filter search field works correctly", function(assert) {
				var oSearchField,
					aFilteredItems,
					fnIsItemVisible = function(oItem) {
						return oItem.getVisible();
					};

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				oSearchField = this.sut._getSearchField();

				//Act
				oSearchField.fireLiveChange({ newValue: "Ap" }); // Matches: Apple, Apricot
				aFilteredItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemVisible, this);

				//Assert
				assert.strictEqual(aFilteredItems.length, 2, "after filter search there are 2 visible items left in the list");

				//Act
				oSearchField.fireLiveChange({ newValue: "" }); // Matches all
				aFilteredItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemVisible, this);

				//Assert
				assert.strictEqual(aFilteredItems.length, 3, "empty query in filter search shows all items");
			});

			QUnit.test("query filter search field updates the select all checkbox", function  (assert) {
				var oSearchField,
					oSelectAllCheckbox;

				this.sut.getFilterItems()[0].getItems()[0].setSelected(true); //text: Apple

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				oSearchField = this.sut._getSearchField();
				oSelectAllCheckbox = this.sut._getSelectAllCheckbox();

				//Assert
				assert.ok(!oSelectAllCheckbox.getSelected(), "at first the select all checkbox is not selected");

				//Act
				oSearchField.fireLiveChange({ newValue: "Apple" }); //Matches the selected item

				//Assert
				assert.ok(oSelectAllCheckbox.getSelected(), "after filter search with selected results only, the select all checkbox is also selected");
			});

			QUnit.test("select all checkbox updates only the filtered items", function  (assert) {
				var oFirstFilterItem = this.sut.getFilterItems()[0],
					oSearchField,
					oSelectAllCheckbox,
					aSelectedItems,
					fnIsItemSelected = function(oItem) {
						return oItem.getSelected();
					};

				oFirstFilterItem.getItems()[0].setSelected(true); //text: Apple
				oFirstFilterItem.getItems()[1].setSelected(true); //text: Apricot

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				oSearchField = this.sut._getSearchField();
				oSelectAllCheckbox = this.sut._getSelectAllCheckbox();
				aSelectedItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemSelected, this);

				//Assert
				assert.strictEqual(aSelectedItems.length, 2, "at first the selected items are 2");

				//Act
				oSearchField.fireLiveChange({ newValue: "Apple" });
				oSelectAllCheckbox.setSelected(false);
				oSelectAllCheckbox.fireSelect({ selected: false });
				oSearchField.fireLiveChange({ newValue: "" }); // Matches: All items

				aSelectedItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemSelected, this);

				//Assert
				assert.equal(aSelectedItems.length, 1, "after deselecting select all checkbox, on a filtered list with 1 selected result, the selected items are only decreased by 1");
			});

			QUnit.test("switching pages keeps the selection", function  (assert) {
				var aSelectedItems,
					fnIsItemSelected = function(oItem) {
						return oItem.getSelected();
					};

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.sut._showContentFor(PAGE_KEYS.Filter); //go back
				this.clock.tick(1000);
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				this.checkToggleDetailListItemAt(0, true);
				this.checkToggleDetailListItemAt(1, true);

				this.sut._showContentFor(PAGE_KEYS.Filter); //go back
				this.clock.tick(1000);
				this.openDetailsPageForItemAt(0); //now open the same details page
				this.clock.tick(1000);

				aSelectedItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemSelected, this);

				//Assert
				assert.strictEqual(aSelectedItems.length, 2, "after switching pages selected items stay");

				//Act
				this.checkToggleDetailListItemAt(0, false);

				aSelectedItems = this.sut._getFilterDetailList().getItems().filter(fnIsItemSelected, this);

				//Assert
				assert.equal(aSelectedItems.length, 1, "after switching pages selecting and deselecting items works");
			});

			QUnit.test("close on details page and reopen", function(assert) {
				var oSpyErrorLogger = this.spy(jQuery.sap.log, "error");

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				this.sut.close();
				this.clock.tick(1000);

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.ok(!oSpyErrorLogger.called, "no errors");
			});

			QUnit.test("ok and cancel buttons", function(assert) {
				var oPopover;

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				oPopover = this.sut._getPopover();

				//Act
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);

				//Assert
				assert.ok(!oPopover.getBeginButton() || !oPopover.getBeginButton().getDomRef(), "ok button does not exist");
				assert.ok(!oPopover.getEndButton() || !oPopover.getEndButton().getDomRef(), "cancel button does not exist");

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				//Assert
				assert.ok(oPopover.getBeginButton() && oPopover.getBeginButton().getDomRef(), "ok button exists");
				assert.ok(oPopover.getEndButton() && oPopover.getEndButton().getDomRef(), "cancel button exists");

				//Act
				this.sut._showContentFor(PAGE_KEYS.Filter);
				this.clock.tick(1000);

				//Assert
				assert.ok(!oPopover.getBeginButton() || !oPopover.getBeginButton().getDomRef(), "ok button does not exist");
				assert.ok(!oPopover.getEndButton() || !oPopover.getEndButton().getDomRef(), "cancel button does not exist");
			});

			QUnit.test("_cancel", function(assert) {
				var aFirstFilterItemSubItems = this.sut.getFilterItems()[0].getItems();

				aFirstFilterItemSubItems[0].setSelected(true);
				aFirstFilterItemSubItems[1].setSelected(true);

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				//Act
				this.checkToggleDetailListItemAt(0, false);
				this.clock.tick(1000);

				this.sut._cancel();
				this.clock.tick(1000);

				//Assert
				assert.ok(!this.sut.isOpen(), "popover is closed");
				assert.ok(aFirstFilterItemSubItems[0].getSelected(), "filter items are restored to previous selection");
			});

			QUnit.test("_confirmFilterDetail", function(assert) {
				var aFirstFilterItemSubItems = this.sut.getFilterItems()[0].getItems(),
					oSpyFireFilterSelected = this.spy(this.sut, "fireFilterSelected");

				aFirstFilterItemSubItems[0].setSelected(true);
				aFirstFilterItemSubItems[1].setSelected(true);

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				//Act
				this.checkToggleDetailListItemAt(0, false);
				this.clock.tick(1000);

				this.sut._confirmFilterDetail();
				this.clock.tick(1000);

				//Assert
				assert.ok(!this.sut.isOpen(), "popover is closed");
				assert.ok(oSpyFireFilterSelected.calledOnce, "event filterSelected fired exactly once");
				assert.ok(oSpyFireFilterSelected.args[0].length, "fired with arguments");
				assert.ok(oSpyFireFilterSelected.args[0][0].items, "arg contains 'items' key");
				assert.strictEqual(oSpyFireFilterSelected.args[0][0].items.length, 1, "arg contains the right number of items");
				assert.strictEqual(oSpyFireFilterSelected.args[0][0].items[0].getId(), aFirstFilterItemSubItems[1].getId(), "arg contains the right items");
			});

			QUnit.module("Phone", {
				beforeEach: function () {
					prepareMobilePlatform.call(this);
					createControls.call(this, [PAGE_KEYS.Sort, PAGE_KEYS.Filter]);
				},
				afterEach: function () {
					destroyControls.call(this);
					restoreFromMobilePlatform.call(this);
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				}
			});

			QUnit.test("detail page", function(assert) {
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				//Assert
				assert.ok(!this.sut._getPopover().getShowHeader(), "has no header");
			});

			// TODO: Enable this test when BCP:1670234655 is resolved
	//		QUnit.test("ok and cancel buttons", function(assert) {
	//			var oPopover;
	//
	//			this.sut.openBy(this.oOpeningButton);
	//			this.clock.tick(1000);
	//
	//			oPopover = this.sut._getPopover();
	//
	//			//Act
	//			this.sut._showContentFor(PAGE_KEYS.Sort);
	//			this.clock.tick(1000);
	//
	//			//Assert
	//			assert.ok(oPopover.getBeginButton() && oPopover.getBeginButton().getDomRef(), "ok button exists");
	//			assert.ok(oPopover.getEndButton() && oPopover.getEndButton().getDomRef(), "cancel button exists");
	//
	//			//Act
	//			this.openDetailsPageForItemAt(0);
	//			this.clock.tick(1000);
	//
	//			//Assert
	//			assert.ok(oPopover.getBeginButton() && oPopover.getBeginButton().getDomRef(), "ok button exists");
	//			assert.ok(oPopover.getEndButton() && oPopover.getEndButton().getDomRef(), "cancel button exists");
	//
	//			//Act
	//			this.sut._showContentFor(PAGE_KEYS.Filter);
	//			this.clock.tick(1000);
	//
	//			//Assert
	//			assert.ok(oPopover.getBeginButton() && oPopover.getBeginButton().getDomRef(), "ok button exists");
	//			assert.ok(oPopover.getEndButton() && oPopover.getEndButton().getDomRef(), "cancel button exists");
	//		});

			QUnit.module("Data binding", {
				beforeEach : function () {
					this.sut = new ViewSettingsPopover();
					this.bindAggregations(this.sut);

					this.oOpeningButton = new Button();
					this.oOpeningButton.placeAt("qunit-fixture");

					sap.ui.getCore().applyChanges();
				},
				afterEach : function () {
					this.sut.destroy();
					this.sut = null;
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				},
				getFirstModelData: function() {
					return {
						sortData: [
							{
								myKey: "key1",
								myText: "Sort text 1 A"
							},
							{
								myKey: "key2",
								myText: "Sort text 2 A"
							}
						],
						groupData: [
							{
								myKey: "groupKey1",
								myText: "Group text A"
							},
							{
								myKey: "groupKey2",
								myText: "Group text 2 A"
							}
						],
						filterData: [
							{
								myKey: "filterKey1",
								myText: "Filter text A",
								myItems: [
									{
										myKey: 'item1',
										myText: 'item A'
									}
								]
							},
							{
								myKey: "filterKey2",
								myText: "Filter text 2 A"
							}
						]
					};
				},
				getSecondModelData: function() {
					return {
						sortData: [
							{
								myKey: "key2",
								myText: "Sort text 1 B"
							}
						],
						groupData: [
							{
								myKey: "groupKey2",
								myText: "Group text B"
							}
						],
						filterData: [
							{
								myKey: "filterKey1",
								myText: "Filter text B",
								myItems: [
									{
										myKey: 'item2',
										myText: 'item B'
									}
								]
							}
						]
					};
				},
				bindAggregations: function() {
					var template1 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template2 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template3 = new ViewSettingsFilterItem({
							key: "{myKey}",
							text: "{myText}",
							items: {
								path: 'myItems',
								template: new ViewSettingsItem({
									key: "{myKey}",
									text: "{myText}"
								}),
								templateShareable: true
							}
						});

					var oModel = new JSONModel();
					oModel.setData(this.getFirstModelData());

					this.sut.setModel(oModel);

					this.sut.bindAggregation("sortItems", "/sortData", template1);
					this.sut.bindAggregation("groupItems", "/groupData", template2);
					this.sut.bindAggregation("filterItems", "/filterData", template3);
				}
			});

			QUnit.test("change sort items in the model", function(assert) {
				var aItems,
					oItem,
					oSecondData = this.getSecondModelData()['sortData'];

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Sort);
				this.clock.tick(1000);

				aItems = this.sut._getSortList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Sort text 1 A', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'first item is rendered before mode property change');

				//Act
				this.sut.getModel().setProperty('/sortData', oSecondData);
				this.clock.tick(1000);

				aItems = this.sut._getSortList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Sort text 1 B', 'correct item is being asserted');
				assert.ok(oItem.getDomRef(), 'second item is rendered after model property change');

				//Act
				oSecondData.push({
					myKey: 'test1',
					myText: 'test1'
				});
				this.sut.getModel().setProperty('/sortData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getSortList().getItems().length, 2, 'item was successfully added');

				//Act
				oSecondData.unshift({
					myKey: 'test2',
					myText: 'test2'
				});
				this.sut.getModel().setProperty('/sortData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getSortList().getItems().length, 3, 'item was successfully inserted');
			});

			QUnit.test("change filter items in the model", function(assert) {
				var aItems,
					oItem,
					oSecondData = this.getSecondModelData()['filterData'];

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Filter);
				this.clock.tick(1000);

				aItems = this.sut._getFilterList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Filter text A', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'first item is rendered before mode property change');

				//Act
				this.sut.getModel().setProperty('/filterData', oSecondData);
				this.clock.tick(1000);

				aItems = this.sut._getFilterList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Filter text B', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'second item is rendered after model property change');

				//Act
				oSecondData.push({
					myKey: 'test1',
					myText: 'test1'
				});
				this.sut.getModel().setProperty('/filterData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getFilterList().getItems().length, 2, 'item was successfully added');

				//Act
				oSecondData.unshift({
					myKey: 'test2',
					myText: 'test2'
				});
				this.sut.getModel().setProperty('/filterData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getFilterList().getItems().length, 3, 'item was successfully inserted');
			});

			QUnit.test("change filter detail items in the model", function (assert) {
				var aItems,
					oItem,
					oSecondData = this.getSecondModelData()['filterData'];

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				aItems = this.sut._filterDetailList.getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'item A', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'first item is rendered before mode property change');

				//Act
				this.sut.getModel().setProperty('/filterData', oSecondData);
				this.openDetailsPageForItemAt(0);
				this.clock.tick(1000);

				aItems = this.sut._getFilterDetailList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'item B', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'second item is rendered after model property change');
				assert.strictEqual(this.sut._getDetailsPage().getHeaderContent()[0].getContentMiddle()[0].getText(),
						'Filter text B',
						'title correctly changed in the header');

				//Act
				oSecondData[0].myItems.push({
					myKey: 'test1',
					myText: 'test1'
				});
				this.sut.getModel().setProperty('/filterData', oSecondData);
				sap.ui.getCore().applyChanges();

				//Assert
				assert.strictEqual(this.sut._getFilterDetailList().getItems().length, 2, 'item was successfully added');

				//Act
				oSecondData[0].myItems.unshift({
					myKey: 'test2',
					myText: 'test2'
				});
				this.sut.getModel().setProperty('/filterData', oSecondData);
				sap.ui.getCore().applyChanges();

				//Assert
				assert.strictEqual(this.sut._getFilterDetailList().getItems().length, 3, 'item was successfully inserted');
			});

			QUnit.test("change group items in the model", function (assert) {
				var aItems,
					oItem,
					oSecondData = this.getSecondModelData()['groupData'];

				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);
				this.sut._showContentFor(PAGE_KEYS.Group);
				this.clock.tick(1000);

				aItems = this.sut._getGroupList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Group text A', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'first item is rendered before mode property change');

				//Act
				this.sut.getModel().setProperty('/groupData', oSecondData);
				this.clock.tick(1000);

				aItems = this.sut._getGroupList().getItems();
				oItem = aItems[0];

				//Assert
				assert.strictEqual(oItem.getTitle(), 'Group text B', 'correct item is being asserted');
				assert.strictEqual(jQuery("#" + oItem.getId()).length, 1, 'second item is rendered after model property change');

				//Act
				oSecondData.push({
					myKey: 'test1',
					myText: 'test1'
				});
				this.sut.getModel().setProperty('/groupData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getGroupList().getItems().length, 2, 'item was successfully added');

				//Act
				oSecondData.unshift({
					myKey: 'test2',
					myText: 'test2'
				});
				this.sut.getModel().setProperty('/groupData', oSecondData);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut._getGroupList().getItems().length, 3, 'item was successfully inserted');
			});

			QUnit.module("Accessibility", {
				beforeEach: function () {
					sinon.config.useFakeTimers = false;

					this.sut = new ViewSettingsPopover({
						sortItems: [
							new ViewSettingsItem({
								key: "1",
								text: "item 1"
							}),
							new ViewSettingsItem({
								key: "2",
								text: "item 2"
							})
						],
						groupItems: [
							new ViewSettingsItem({
								key: "1",
								text: "item 1"
							}),
							new ViewSettingsItem({
								key: "2",
								text: "item 2"
							})
						],
						filterItems: [
							new ViewSettingsFilterItem({
								key: "filter0",
								text: "filter item 0",
								items: [
									new ViewSettingsItem({
										key: "filter0-sub0",
										text: "filter item 0 sub 0"
									}),
									new ViewSettingsItem({
										key: "filter0-sub1",
										text: "filter item 0 sub 1"
									})
								]
							}),
							new ViewSettingsItem({
								key: "2",
								text: "item 2"
							})
						]
					});

					this.oBtn = new Button().placeAt("qunit-fixture");
					sap.ui.getCore().applyChanges();

					this.sut.openBy(this.oBtn);
				},
				afterEach: function () {
					sinon.config.useFakeTimers = true;
					this.oBtn.destroy();
					this.sut.destroy();
					this.oBtn = null;
					this.sut = null;
				}
			});

			QUnit.test("Dialog", function (assert) {
				var done = assert.async();

				jQuery.sap.delayedCall(0, this, function () {
					var sLabelledBy,
						domRef = this.sut._getPopover().getDomRef(),
						sPopoverAriaLabelId = this.sut._getPopoverAriaLabel();

					assert.ok(domRef, "Popover is available");
					assert.strictEqual(domRef.getAttribute("role"), "dialog", "Popover has role='dialog'");

					sLabelledBy = domRef.getAttribute("aria-labelledby");
					assert.ok(sLabelledBy, "Has associated aria-labelledby");
					assert.ok(sLabelledBy.indexOf(sPopoverAriaLabelId), "Popover's label element exists");

					assert.ok(domRef.querySelectorAll("[role=toolbar]").length, "Has div with role=toolbar inside");
					done();
				});
			});

			QUnit.test("Dialog ariaLabelledBy element changes its text when navigating to filter details page", function (assert) {
				var done = assert.async();

				assert.expect(5);

				jQuery.sap.delayedCall(0, this, function () {
					var sLabelledBy,
						domRef = this.sut._getPopover().getDomRef(),
						oFilterByButton = this.sut._getSegmentedButton().getItems()[1],
						oFilterListItem0 = this.sut._getFilterList().getItems()[0];

					//Act
					oFilterByButton.firePress();
					this.sut._getNavContainer().attachEventOnce("afterNavigate", function() {
						var sPopoverAriaLabelId = this.sut._getPopoverAriaLabel();

						//Assert
						sLabelledBy = domRef.getAttribute("aria-labelledby");
						assert.ok(sLabelledBy, "Has associated aria-labelledby");
						assert.ok(sLabelledBy.indexOf(sPopoverAriaLabelId), "Has associated aria-labelledby with custom text");
						assert.ok(jQuery("#" + sPopoverAriaLabelId).length, "Popover's label element exists");

						assert.equal(jQuery("#" + sPopoverAriaLabelId).text(), "Filter By:filter item 0", "Popover's label element has certain text");

						//Navigate Back
						//Act
						this.sut._getNavContainer().attachEventOnce("afterNavigate", function() {
							//Assert
							assert.equal(jQuery("#" + sPopoverAriaLabelId).text(), "Filter By", "After back navigation from Filter Details page, Popover's label element has certain text");
							done();
						});
						jQuery("[title='Navigate Back']").control()[0].firePress();

					}.bind(this));
					oFilterListItem0.firePress();
				});
			});

			QUnit.test("Toolbar", function (assert) {
				var done = assert.async();

				jQuery.sap.delayedCall(0, this, function () {
					var i, oSegmentedButton = this.sut._getSegmentedButton(),
						aSegmentedButtonItems = oSegmentedButton.getItems(),
						oToolbar = this.sut._getToolbar(),
						domRef = oToolbar.getDomRef();

					assert.ok(domRef, "Popover is available");
					assert.strictEqual(domRef.getAttribute("role"), "toolbar", "Toolbar has role='toolbar'");

					assert.ok(oToolbar.getContent()[0] == oSegmentedButton, "There are segmented buttons inside toolbar");
					assert.strictEqual(aSegmentedButtonItems.length, 3, "There should be 3 items in the segmented button");
					for (i = 0; i < 3; i++) {
						assert.ok(aSegmentedButtonItems[i].getTooltip(), "Each Segmentedbutton item should have a tooltip");
					}

					done();
				});
			});

			// BCP: 1780409422
			QUnit.test("close button", function (assert) {
				// arrange
				this.sut._getToolbar();

				// assert
				assert.equal(this.sut._oCloseBtnARIAInvText, undefined, "no invisible text is created for aria-labelledby for the close button");
				assert.equal(this.sut._toolbar.getContent()[2].getAriaLabelledBy().length, 0, "close button has no ariaLabelledBy items in the association");
			});



			QUnit.module("Single Data Point", {
				beforeEach : function () {
					this.sut = new ViewSettingsPopover();
					this.bindAggregations();

					this.oOpeningButton = new Button();
					this.oOpeningButton.placeAt("content");

					sap.ui.getCore().applyChanges();
				},
				afterEach : function () {
					destroyControls.call(this);
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				},
				getFirstModelData: function() {
					return {
						sortData: [
							{
								myKey: "key1",
								myText: "Sort text 1 A"
							}
						],
						groupData: [
							{
								myKey: "groupKey1",
								myText: "Group text A"
							}
						],
						filterData: [
							{
								myKey: "filterKey1",
								myText: "Filter text A",
								myItems: [
									{
										myKey: 'item1',
										myText: 'item A'
									}
								]
							}
						]
					};
				},
				bindAggregations: function() {
					var template1 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template2 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template3 = new ViewSettingsFilterItem({
							key: "{myKey}",
							text: "{myText}",
							items: {
								path: 'myItems',
								template: new ViewSettingsItem({
									key: "{myKey}",
									text: "{myText}"
								}),
								templateShareable: true
							}
						});

					var oModel = new JSONModel();
					oModel.setData(this.getFirstModelData());

					this.sut.setModel(oModel);

					this.sut.bindAggregation("sortItems", "/sortData", template1);
					this.sut.bindAggregation("groupItems", "/groupData", template2);
					this.sut.bindAggregation("filterItems", "/filterData", template3);
				}
			});

			QUnit.test("Single sort data point", function (assert) {
				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Act
				var fnFireSortSelectedSpy = sinon.spy(this.sut, "fireSortSelected");

				this.sut._getSegmentedButton().getButtons()[0].firePress();
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(fnFireSortSelectedSpy.calledOnce, true, "sortSelected event fired");
				assert.strictEqual(this.sut.isOpen(), false, 'Popup is closed');
			});

			QUnit.test("Single filter data point", function (assert) {
				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Act
				this.sut._getSegmentedButton().getButtons()[1].firePress();
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is still open');
				assert.strictEqual(sap.ui.getCore().byId(this.sut.getId() + '-backbutton'), undefined, 'No back button');
			});

			QUnit.test("Single group data point", function (assert) {
				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Act
				var fnFireGroupSelectedSpy = sinon.spy(this.sut, "fireGroupSelected");

				this.sut._getSegmentedButton().getButtons()[2].firePress();
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(fnFireGroupSelectedSpy.calledOnce, true, "groupSelected event fired");
				assert.strictEqual(this.sut.isOpen(), false, 'Popup is closed');
			});




			QUnit.module("Single Tab", {
				beforeEach : function () {
					this.sut = new ViewSettingsPopover();
					this.bindAggregations();

					this.oOpeningButton = new Button();
					this.oOpeningButton.placeAt("content");

					sap.ui.getCore().applyChanges();
				},
				afterEach : function () {
					destroyControls.call(this);
				},
				openDetailsPageForItemAt: function(index) {
					var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[index]);
					this.sut._showContentFor(PAGE_KEYS.FilterDetail, oListItem);
				},
				getFirstModelData: function() {
					return {
						sortData: [
							{
								myKey: "key1",
								myText: "Sort text 1 A"
							},
							{
								myKey: "key21",
								myText: "Sort text 2 A"
							}
						]
					};
				},
				bindAggregations: function() {
					var template1 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template2 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template3 = new ViewSettingsFilterItem({
							key: "{myKey}",
							text: "{myText}",
							items: {
								path: 'myItems',
								template: new ViewSettingsItem({
									key: "{myKey}",
									text: "{myText}"
								}),
								templateShareable: true
							}
						});

					var oModel = new JSONModel();
					oModel.setData(this.getFirstModelData());

					this.sut.setModel(oModel);

					this.sut.bindAggregation("sortItems", "/sortData", template1);
					this.sut.bindAggregation("groupItems", "/groupData", template2);
					this.sut.bindAggregation("filterItems", "/filterData", template3);
				}
			});

			QUnit.test("Single sort tab", function (assert) {
				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Assert
				assert.strictEqual(this.sut._getTitle().getText(),
					sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("VIEWSETTINGS_TITLE_SORT"));
			});

			QUnit.test("Single group tab", function (assert) {
				//Act
				this.sut.removeAllAggregation('sortItems');
				this.sut.addGroupItem(new TabStripItem({
					key: 'test1',
					text: 'test1'
				}));
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Assert
				assert.strictEqual(this.sut._getTitle().getText(),
					sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("VIEWSETTINGS_TITLE_SORT"));
			});

			QUnit.test("Single filter tab", function (assert) {
				//Act
				this.sut.removeAllAggregation('groupItems');
				this.sut.addFilterItem(new TabStripItem({
					key: 'test2',
					text: 'test2'
				}));
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Assert
				assert.strictEqual(this.sut.isOpen(), true, 'Popup is open');

				//Assert
				assert.strictEqual(this.sut._getTitle().getText(),
					sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("VIEWSETTINGS_TITLE"));
			});


			QUnit.module("Remove Filter", {
				beforeEach : function () {
					this.sut = new ViewSettingsPopover('removefilter');
					this.bindAggregations();

					this.oOpeningButton = new Button();
					this.oOpeningButton.placeAt("content");

					sap.ui.getCore().applyChanges();
				},
				afterEach : function () {
					destroyControls.call(this);
				},
				getFirstModelData: function() {
					return {
						sortData: [
							{
								myKey: "key1",
								myText: "Sort text 1 A"
							},
							{
								myKey: "key21",
								myText: "Sort text 2 A"
							}
						],
						groupData: [
							{
								myKey: "groupKey1",
								myText: "Group text A"
							},
							{
								myKey: "groupKey2",
								myText: "Group text B"
							}
						],
						filterData: [
							{
								myKey: "filterKey1",
								myText: "Filter text A",
								myItems: [
									{
										myKey: 'item1',
										myText: 'item A'
									}
								]
							},
							{
								myKey: "filterKey2",
								myText: "Filter text B",
								myItems: [
									{
										myKey: 'item2',
										myText: 'item B'
									}
								]
							}
						]
					};
				},
				bindAggregations: function() {
					var template1 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template2 = new ViewSettingsItem({
							key: "{myKey}",
							text: "{myText}"
						}),
						template3 = new ViewSettingsFilterItem({
							key: "{myKey}",
							text: "{myText}",
							items: {
								path: 'myItems',
								template: new ViewSettingsItem({
									key: "{myKey}",
									text: "{myText}"
								}),
								templateShareable: true
							}
						});

					var oModel = new JSONModel();
					oModel.setData(this.getFirstModelData());

					this.sut.setModel(oModel);

					this.sut.bindAggregation("sortItems", "/sortData", template1);
					this.sut.bindAggregation("groupItems", "/groupData", template2);
					this.sut.bindAggregation("filterItems", "/filterData", template3);
				}
			});

			QUnit.test("No filter by default, setting and removing a filter", function (assert) {
				//Act
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//Act
				this.sut._getSegmentedButton().getButtons()[1].firePress();
				this.clock.tick(1000);

				// Assert
				var oFilterList = this.sut._getFilterList();
				var oFilterItems = oFilterList.getItems();
				var oLastListItem = oFilterItems[oFilterItems.length - 1];

				assert.strictEqual(oLastListItem.getTitle(), 'Filter text B', 'Last item is not "Remove Filter"');

				// Act
				var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[0]);
				this.sut._showContentFor('filterDetail', oListItem);
				this.clock.tick(1000);
				var oDetailItem = this.sut._getFilterDetailList().getItems()[0];
				oDetailItem.setSelected(true);
				this.sut._getFilterDetailList()._fireSelectionChangeEvent([oDetailItem]);
				this.clock.tick(1000);
				this.sut._showContentFor('filter');
				this.clock.tick(1000);

				oFilterList = this.sut._getFilterList();
				oFilterItems = oFilterList.getItems();
				oLastListItem = oFilterItems[oFilterItems.length - 1];

				// Assert
				assert.strictEqual(oLastListItem.getTitle(),
					sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("REMOVE_FILTER"),
					'Last item is "Remove Filter"');

				// Act
				var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[0]);
				this.sut._showContentFor('filterDetail', oListItem);
				this.clock.tick(1000);
				var oDetailItem = this.sut._getFilterDetailList().getItems()[0];
				oDetailItem.setSelected(false);
				this.sut._getFilterDetailList()._fireSelectionChangeEvent([oDetailItem]);
				this.clock.tick(1000);
				this.sut._showContentFor('filter');
				this.clock.tick(1000);

				oFilterList = this.sut._getFilterList();
				oFilterItems = oFilterList.getItems();
				oLastListItem = oFilterItems[oFilterItems.length - 1];

				// Assert
				assert.strictEqual(oLastListItem.getTitle(), 'Filter text B', 'Last item is not "Remove Filter"');

				// Act
				var oListItem = this.sut._findListItemFromViewSettingsItem(this.sut.getFilterItems()[0]);
				this.sut._showContentFor('filterDetail', oListItem);
				this.clock.tick(1000);
				var oDetailItem = this.sut._getFilterDetailList().getItems()[0];
				oDetailItem.setSelected(true);
				this.sut._getFilterDetailList()._fireSelectionChangeEvent([oDetailItem]);
				this.clock.tick(1000);
				this.sut._showContentFor('filter');
				this.clock.tick(1000);

				oFilterList = this.sut._getFilterList();
				oFilterItems = oFilterList.getItems();
				oLastListItem = oFilterItems[oFilterItems.length - 1];

				// Assert
				assert.strictEqual(oLastListItem.getTitle(),
					sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("REMOVE_FILTER"),
					'Last item is "Remove Filter"');

				// Act
				oLastListItem.firePress();
				this.sut.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				this.sut._getSegmentedButton().getButtons()[1].firePress();
				this.clock.tick(1000);

				// Assert
				var oFilterList = this.sut._getFilterList();
				var oFilterItems = oFilterList.getItems();
				var oLastListItem = oFilterItems[oFilterItems.length - 1];

				assert.strictEqual(oLastListItem.getTitle(), 'Filter text B', 'Last item is not "Remove Filter"');
			});

			QUnit.module("Miscellaneous");

			QUnit.test("Setting any property does not prevent internal popover to be destroyed ", function(assert) {
				var oVSP = new ViewSettingsPopover({tooltip: "Hello"});
				oVSP.placeAt('qunit-fixture');

				sap.ui.getCore().applyChanges();
				oVSP.destroy();

				assert.equal(oVSP._popover, null, "After destroy, no internal _popover instance should be available");
			});

			QUnit.module("Custom tabs", {
				beforeEach : function () {
					this.oCustomTab1 = new ViewSettingsCustomTab({
						id: "custom-tab1",
						content: [new Label({text: "test"})]
					});
					this.oCustomTab2 = new ViewSettingsCustomTab({
						id: "custom-tab2",
						content: [new Label({text: "lorem ipsum label"})]
					});

					this.oVSP = new ViewSettingsPopover("ctp", {
						customTabs: [
							this.oCustomTab1,
							this.oCustomTab2
						]
					});

					this.oOpeningButton = new Button();

					this.oOpeningButton.placeAt('qunit-fixture');
					this.oVSP.placeAt('qunit-fixture');
					sap.ui.getCore().applyChanges();
				},
				afterEach : function () {
					this.oVSP.destroy();
					this.oVSP = null;
					this.oCustomTab1.destroy();
					this.oCustomTab1 = null;
					this.oCustomTab2.destroy();
					this.oCustomTab2 = null;
					this.oOpeningButton.destroy();
					this.oOpeningButton = null;
				}
			});

			QUnit.test("Buttons for all custom tabs should be rendered", function (assert) {
				var sId = this.oVSP.getId();

				this.oVSP.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//assert
				assert.ok(jQuery.sap.domById(sId + "custom-tab1-custom-button-button"), "Button is rendered custom tab.");
				assert.ok(jQuery.sap.domById(sId + "custom-tab2-custom-button-button"), "Button is rendered custom tab.");
			});

			QUnit.test("Check if reserved tab ids are properly handled.", function (assert) {
				var oTab = new ViewSettingsCustomTab('sort');
				var sErrorMessage;
				try {
					this.oVSP.addCustomTab(oTab);
				} catch (e) {
					sErrorMessage = e.message;
				}

				assert.strictEqual(sErrorMessage, 'Id "sort" is reserved and cannot be used as custom tab id.', 'Error is properly thrown when reserved tab id is used.');
			});

			QUnit.test("Test customTabs rendered correct content", function (assert){
				this.oVSP.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//assert
				// click on first custom tab
				this.oVSP._showContentFor('custom-tab1');
				assert.strictEqual(this.oVSP._getMainPage().getContent()[0].getText(), "test", "Correct content is shown inside the page when clicked on the custom tab");
				assert.strictEqual(this.oVSP.getAggregation("customTabs")[0].getContent().length, 0, "The content is removed from the custom tab and it is inside the page");

				// click on second custom tab
				this.oVSP._showContentFor('custom-tab2');
				assert.strictEqual(sap.ui.getCore().byId("ctp").getAggregation("customTabs")[0].getContent().length, 1, "The content of the first custom tab is returned to its content aggregation");
				assert.ok(!(this.oVSP._getMainPage().getContent()[0].getText() === "test"), "The content of the first tab is not inside the page");
				assert.strictEqual(this.oVSP._getMainPage().getContent()[0].getText(), "lorem ipsum label", "The content of the second tab is shown inside the page");
			});

			QUnit.test("Test customTabs when removed one of the tabs, segmented button item will be also removed", function (assert){
				var sId = this.oVSP.getId(),
					oSButton = sap.ui.getCore().byId(sId + "-segmented");

				this.oVSP.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				// arrange
				// click on first custom tab
				this.oVSP._showContentFor('custom-tab1');
				//remove first custom tab
				this.oVSP.removeAggregation("customTabs", this.oVSP.getAggregation("customTabs")[0]);
				sap.ui.getCore().applyChanges();

				//assert
				assert.strictEqual(this.oVSP.getAggregation("customTabs").length, 1, "There is only one custom tab after removing the first one");
				assert.strictEqual(oSButton.getAggregation("items").length, 1, "There is only one item inside the SegmentedButton after removing first custom tab");
				assert.strictEqual(this.oVSP._getMainPage().getContent()[0].getText(), "lorem ipsum label", "The content of the second tab is shown inside the page");
			});

			QUnit.test("Test customTabs when there is only one tab, its's content will be opened directly", function (assert){
				//remove one of the custom buttons so we can have only one
				this.oVSP.removeAggregation("customTabs", this.oVSP.getAggregation("customTabs")[0]);
				sap.ui.getCore().applyChanges();

				this.oVSP.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//assert
				assert.strictEqual(this.oVSP._getMainPage().getContent()[0].getText(), "lorem ipsum label", "The content of the second tab is shown inside the page");
			});

			QUnit.test("Test customTabs when removed all tabs the default empty page will be shown", function (assert){
				assert.strictEqual(sap.ui.getCore().byId("ctp").getAggregation("customTabs").length, 2, "Custom tab aggregation exists and has two custom tabs");

				//remove all custom tabs
				this.oVSP.removeAllAggregation("customTabs");
				sap.ui.getCore().applyChanges();

				this.oVSP.openBy(this.oOpeningButton);
				this.clock.tick(1000);

				//assert
				assert.strictEqual(this.oVSP._getMainPage().getContent().length, 0, "Default page is shown once all custom tabs are removed and there is no predifined tabs");
			});


		} else {

			//TBD: Enable Unit tests also in mobile scenarios
			QUnit.module("Basics", {
				beforeEach: function () {
				},
				afterEach: function () {
				}
			});

			QUnit.test("Skip tests on mobile devices", function (assert) {
				assert.ok(true, "Skip tests on mobile devices");
			});

		}

		QUnit.start();
	});

})();