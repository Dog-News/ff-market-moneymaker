<template>
    <div class="content-area">
        <div class="container-fullwidth px-5 pt-5 pb-2">

<div class="row">
    <div class="col-md-12 m-auto">
                <h1>Crafting</h1>
            </div>
            </div>
            </div>
        <div class="container-fullwidth">

            <div class="row">
                <div class="col-md-12 m-auto">
                    <div class="float-left pl-5">
                    <div class="d-flex">
                        <b-form-group class="mb-0">
                            <b-input-group size="sm">
                                <b-form-input id="filter-input" v-model="itemNameFilter" type="search" placeholder="Type to Search" debounce="200"></b-form-input>
                            <b-input-group-append>
                                <b-button :disabled="!itemNameFilter" @click="itemNameFilter = ''">Clear</b-button>
                            </b-input-group-append>
                            </b-input-group>
                        </b-form-group>
                    
                        <b-dropdown id="dropdown-1" text="Filter by Job" class="ml-4" variant="outline-dark">
                            <b-dropdown-form>
                                <b-form-checkbox-group v-model="craftTypeFilter"  class="mt-1">
                                    <b-form-checkbox value="Woodworking">Woodworking</b-form-checkbox>
                                    <b-form-checkbox value="Smithing">Smithing</b-form-checkbox>
                                    <b-form-checkbox value="Armorcraft">Armorcraft</b-form-checkbox>
                                    <b-form-checkbox value="Goldsmithing">Goldsmithing</b-form-checkbox>
                                    <b-form-checkbox value="Leatherworking">Leatherworking</b-form-checkbox>
                                    <b-form-checkbox value="Clothcraft">Clothcraft</b-form-checkbox>
                                    <b-form-checkbox value="Alchemy">Alchemy</b-form-checkbox>
                                    <b-form-checkbox value="Cooking">Cooking</b-form-checkbox>
                                </b-form-checkbox-group>
                            </b-dropdown-form>
                        </b-dropdown>
                         <b-dropdown id="dropdown-1" text="Filter Minimums" class="ml-1" variant="outline-dark">
                            <b-dropdown-form>
                                <b-form-group label="Volume" label-for="min-vol" @submit.stop.prevent>
                                    <b-form-input
                                        v-model="minVolumeFilter"
                                        id="min-vol"
                                        size="sm"
                                        placeholder="100"
                                        debounce="200"
                                    ></b-form-input>
                                </b-form-group>
                                <b-form-group label="Profit" label-for="min-profit" @submit.stop.prevent>
                                    <b-form-input
                                        v-model="minProfitFilter"
                                        id="min-profit"
                                        size="sm"
                                        placeholder="10,000"
                                        debounce="200"
                                    ></b-form-input>
                                </b-form-group>
                                <b-form-group label="Percent" label-for="min-percent" @submit.stop.prevent>
                                    <b-form-input
                                        v-model="minProfitPercentFilter"
                                        id="min-percent"
                                        size="sm"
                                        placeholder="25"
                                        debounce="200"
                                    ></b-form-input>
                                </b-form-group>
                            </b-dropdown-form>
                        </b-dropdown>
                        <b-button class="ml-1" @click="itemNameFilter = null; craftTypeFilter = []; minVolumeFilter = null; minProfitFilter = null; minProfitPercentFilter = null;">Clear Filters</b-button>
                    </div>
                    
                    </div>
                    <div class="float-right pr-5">
                        <b-pagination v-model="currentPage" :total-rows="totalRows" :per-page="perPage" aria-controls="item-table"></b-pagination>
                    </div>

                    <!--
                        :filter="filter"
                        @filtered="onFiltered" 
                        :filter-included-fields="filterOn"
                        :tdClass="styleTableDataCell"
                    -->





                    <b-table 
                        id="item-table" 
                        hover
                        class="bg-light"
                        :per-page="perPage" 
                        :current-page="currentPage" 
                        :fields="tableFields" 
                        :items="filteredCraftableItems"
                        sort-direction="desc"
                        @row-clicked="(item) => {modalData = item; $bvModal.show('bv-modal-example')}"

                    >
                    
                    <!--
                        <template #thead-top="data">
                            <b-th colspan="3" class="top-heading">Item Info</b-th>
                            <b-th colspan="3" class="top-heading world-heading">High Quality</b-th>
                            <b-th colspan="3" class="top-heading world-heading">Normal Quality</b-th>
                        </template>
                    -->
                        <template #cell(itemID)="itemID">
                            <a :href="'https://universalis.app/market/' + itemID.value" :target="'_blank'">{{itemID.value}}</a>
                        </template>

                        <template #cell(hq)="hq">
                            <nuxt-img src="/images/hq.png" v-if="hq.value" />
                        </template>

                        <!-- Crafting recipe details -->

                        <!-- <template #cell(show_details)="row">
                            <b-button size="sm" @click="row.toggleDetails" class="mr-2">
                            {{ row.detailsShowing ? 'Hide' : 'Show'}}
                            </b-button>
                        </template> -->

                        <template #cell(totalCraftCost)="totalCraftCost">
                            <span class="">
                                <span @click="totalCraftCost.toggleDetails" style="cursor: pointer;">{{totalCraftCost.value}}</span>
                            </span>
                        </template>

                        <template #cell(itemName)="row">
                        <div class="d-flex align-items-center">
                        <div class="mr-4 item-icon-container">
                            <nuxt-img :src="'/images/icon2x/' + row.item.itemID + '.png'" width="56" placeholder="/images/item-placeholder.png" />
                            <img class="icon-overlay" src="/images/image-overlay.png">
                        </div>
                        <div>
                            <h4 class="mb-1">{{row.item.itemName}} <img style="margin-top:-2px" :src="row.item.hq ? '/images/hq-light.png' : ''"></h4>
                            <a :href="'https://universalis.app/market/' + row.item.itemID" :target="'_blank'"><span class="badge badge-pill badge-light">#{{row.item.itemID}}</span></a>
                        </div>
                        </div>
                        </template>


                        <template #cell(profit)="profit">
                            <span :class="profit.unformatted > 0 ? 'good' : 'bad'">{{profit.value}}</span>
                        </template>

                        
                        <template #cell(profitPercentage)="profitPercentage">
                            <span :class="profitPercentage.unformatted > 0 ? 'good' : 'bad'">{{profitPercentage.value}}</span>
                        </template>
      
                        <template #row-details="row">




                            <b-card>
                                <table v-for="(recipe, index) in row.item.recipes" class="mr-4 mb-4">
                                    <tr><th colspan="4" class="text-left">{{recipe.craftType}}</th></tr>
                                    <tr v-for="item in recipe.ingredients">
                                    <td><a :href="'https://universalis.app/market/' + item.itemID" :target="'_blank'">{{item.itemID}}</a></td>
                                    <td class="text-left">{{item.itemName}}</td>
                                    <td>{{item.lowestMedianPrice}} ɢ</td>
                                    <td>x {{item.ingredientAmount}}</td>
                                    </tr>
                                </table>
                            </b-card>
                        </template>

                    </b-table>
                                    </div>

<button @click="$bvModal.show('bv-modal-example')">Test</button>
  <b-modal id="bv-modal-example" size="lg" centered hide-footer>
    <template #modal-title>
      Using <code>$bvModal</code> Methods
    </template>
    <div class="d-block text-center">
        <b-card>
        <div class="row">
        <div class="col-6">
            <table v-for="(recipe, index) in modalData?.recipes" class="mr-4 mb-4">
                <tr><th colspan="4" class="text-left">{{recipe.craftType}}</th></tr>
                <tr v-for="item in recipe.ingredients">
                <td><a :href="'https://universalis.app/market/' + item.itemID" :target="'_blank'">{{item.itemID}}</a></td>
                <td class="text-left">{{item.itemName}}</td>
                <td>{{item.lowestMedianPrice}} ɢ</td>
                <td>x {{item.ingredientAmount}}</td>
                </tr>
            </table>
            </div>
            <div class="col-6">
            <table v-for="(recipe, index) in modalData?.recipes" class="mr-4 mb-4">
                <tr><th colspan="4" class="text-left">{{recipe.craftType}}</th></tr>
                <tr v-for="item in recipe.ingredients">
                <td><a :href="'https://universalis.app/market/' + item.itemID" :target="'_blank'">{{item.itemID}}</a></td>
                <td class="text-left">{{item.itemName}}</td>
                <td>{{item.lowestMedianPrice}} ɢ</td>
                <td>x {{item.ingredientAmount}}</td>
                </tr>
            </table>
            </div>
            </div>
        </b-card>
    </div>
    <b-button class="mt-3 btn btn-primary" block @click="$bvModal.hide('bv-modal-example')">Update</b-button>
  </b-modal>

                <div class="col-md-12 m-auto">
                    <div class="float-right pr-5 pb-5">
                        <b-pagination
                            v-model="currentPage"
                            :total-rows="totalRows"
                            :per-page="perPage"
                            aria-controls="item-table"
                        ></b-pagination>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return{
            tableFields: [
                // {key: 'show_details', label: ""},
                // {key: "itemID", label: "Item ID", sortable: true},
                // {key: "hq", label: "Quality", sortable: true},
                // {key: "itemName", label: "Name", sortable: true, class:["table-text-data", "item-name-col"]},
                {key: 'itemName', class: "item-name pl-5", sortable: true},
                {key: "volume", label: "Vol", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                {key: "avgStackSize",  label:"Stack", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                {key: "totalCraftCost", label: "Cost", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")  + " ɢ"}},
                {key: "medianSalePrice", label: "Sells", sortable: true, class: "world-heading", formatter: (value, key, item) => {return item.medianSalePrice != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                {key: "profit", label: "Profit", class: "font-weight-bold", sortable: true, formatter: (value, key, item) => {return item.medianSalePrice != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                {key: "profitPercentage", class: "pr-5", label: "Profit %", sortable: true, formatter: (value, key, item) => {return item.profitPercentage != 0 ? value?.toLocaleString("en-US") + "%" : ''}},
                // {key: "hqMedianSalePrice", label: "Sells", sortable: true, class: "world-heading", formatter: (value, key, item) => {return item.hqMedianSalePrice != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                // {key: "hqProfit", label: "Profit", sortable: true, formatter: (value, key, item) => {return item.hqMedianSalePrice != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                // {key: "hqProfitPercentage", label: "Profit %", sortable: true, formatter: (value, key, item) => {return item.hqMedianSalePrice != 0 ? value?.toLocaleString("en-US") + "%" : ''}},
                // {key: "nqMedianSalePrice", label: "Sells", sortable: true, class: "world-heading", formatter: (value, key, item) => {return item.nqProfitPercentage != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                // {key: "nqProfit", label: "Profit", sortable: true, formatter: (value, key, item) => {return item.nqProfitPercentage != 0 ? value.toLocaleString("en-US")  + " ɢ" : ''}},
                // {key: "nqProfitPercentage", label: "Profit %", sortable: true, formatter: (value, key, item) => {return item.nqProfitPercentage != 0 ? value?.toLocaleString("en-US") + "%" : ''}},
            ],
            craftableItems: null,
            datadump: null,
            // selectedDataCenter: "Primal",
            selectedDataCenterPrice: null,
            selectedDataCenterForData: null, // for displaying in the table after request
            totalRows: 0,
            currentPage: 1,
            perPage: 50,
            itemNameFilter: null,
            craftTypeFilter: [],
            minVolumeFilter: null,
            minProfitFilter: null,
            minProfitPercentFilter: null,
            filterOn: ["itemName", "craftTypes"],
            modalData: null
        }
    },
    async mounted() {
        this.totalRows = this.craftableItems?.length;
        this.loadData();
    },
    methods: {
        async loadData() {
            if (!this.selectedDataCenter) return;
            const data = await this.$axios.$get(`http://localhost:4001/api/getCraftableItems/${this.selectedDataCenter}`);
            this.craftableItems = data;
            this.selectedDataCenterForData = this.selectedDataCenter // do this so changing drop down menu doesn't update the table display until requested again
            this.totalRows = this.craftableItems?.length;
        },
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems?.length
            this.currentPage = 1
        },
        styleTableDataCell(value, key, item){
            if (key === "hqProfitPercentage" || key === "nqProfitPercentage") {

                // good-0
                // good-25
                // good-50
                // good-75
                // return value >= ? ''
            }
        }
    },
    watch: {
        selectedDataCenter(newValue, oldValue) {
            this.craftableItems = []; // Clear the data
            this.loadData();
        }
    },
    computed: {
        selectedDataCenter() {
            return this.$store.state.selectedDataCenter;
        },
        filteredCraftableItems() {
            const filterOnCraftType = this.craftTypeFilter.length > 0 ? true : false;
            const filterOnItemName = !!this.itemNameFilter ? true : false;
            const filterOnVolume = !!this.minVolumeFilter ? true : false;
            const filterOnProfit = !!this.minProfitFilter ? true : false;
            const filterOnProfitPercent = !!this.minProfitPercentFilter ? true : false;

            const checkItemNameMatchesFilter = (itemName) => {
                if (filterOnItemName) {
                    return !(itemName.toUpperCase().includes(this.itemNameFilter.toUpperCase())) ? false : true
                }
                return true;
            };

            const checkCraftTypeMatchesFilter = (craftTypes) => {
                if (filterOnCraftType) {
                    for (let craftType of craftTypes) {
                        if (this.craftTypeFilter.includes(craftType)) return true;
                    }
                    return false;
                }
                return true;
            };

            const checkMinVolumeFilter = (volume) => {
                if (filterOnVolume) {
                    return volume >= this.minVolumeFilter ? true : false;
                }
                return true;
            };

            const checkMinProfitFilter = (profit) => {
                if (filterOnProfit) {
                    return profit >= this.minProfitFilter ? true : false;
                    debugger;
                }
                return true;
            };

            const checkMinProfitPercent = (profitPercent) => {
                if (filterOnProfitPercent) {
                    return profitPercent >= this.minProfitPercentFilter ? true : false;
                }
                return true;
            };

            const filteredCraftableItems = this.craftableItems?.filter((item) => {
                const craftTypes = item.craftTypes;
                const itemName = item.itemName;
                const volume = item.volume;
                const profit = item.profit;
                const profitPercent = item.profitPercentage;
                const itemNameMatchesFilter = checkItemNameMatchesFilter(itemName);
                const craftTypeMatchesFilter = checkCraftTypeMatchesFilter(craftTypes);
                const minVolumeFilter = checkMinVolumeFilter(volume);
                const minProfitFilter = checkMinProfitFilter(profit);
                const minProfitPercentFilter = checkMinProfitPercent(profitPercent);
                return (itemNameMatchesFilter && craftTypeMatchesFilter && minVolumeFilter && minProfitFilter && minProfitPercentFilter);
            });

            // if no filter, return the unfiltered list of items
            this.totalRows = filteredCraftableItems?.length
            return filteredCraftableItems;
        },
    },
    name: 'IndexPage'
}
</script>
<style>
    table td, table th { text-align: right; }
    .table-text-data { text-align: left; }
    .good { color: #12cc12}
    .bad { color: red; }
    .good:before {content: "+"}
    .table th, .table td {
        padding: 8px 0.75rem;
    }
    /*
     Fix an issue in vue-bootstrap v2.22.0:
    https://github.com/bootstrap-vue/bootstrap-vue/issues/6961 
    */
    #item-table { border: 1px solid #dee2e6; border-radius: 2px; } 
    #item-table td { vertical-align: middle; }
    #item-table thead {
    position: sticky;
    z-index: 999;
    top: 0;
    
    }
        /*
    .world-heading, .world-section {
        border-left: 1px solid #dee2e6;
    }

    .table.b-table.table-dark > thead > tr > .bg-b-table-default, .table.b-table.table-dark > tbody > tr > .bg-b-table-default, .table.b-table.table-dark > tfoot > tr > .bg-b-table-default { background-color: transparent; }
    .pagination button, .pagination .page-item.disabled span { background: transparent; }
    .pagination .page-item.disabled .page-link, .pagination .page-link { border-color: #454d55; }
    .page-link { color: white; }
    */
    .item-name {
        text-align: left;
    }
    #filter-input { 
        /*background-color: transparent;
        border-color: #454d55; 
        color: white; */
        padding: 0.5rem 0.75rem;
        height: initial;
    }

#item-table > thead > tr > th {
    border-bottom: 1px solid #dee2e6;

}
.table thead th {
     background-color: #f8f9fa;
 background-clip: padding-box;
     border-bottom: 1px solid #dee2e6;
    
}
.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
#item-table thead { text-transform: uppercase; letter-spacing: 2px; font-size: 12px; }
#item-table .top-heading { text-transform: initial; letter-spacing: initial; font-size: initial;  text-align: left;}

.item-icon-container { position: relative; overflow: visible; }
.icon-overlay { position: absolute; z-index: 99; top: -3px; left: -5px; }

/* THING THAT SHOULD BE IN VARIABLES*/
h1 { font-size: 30px; text-transform: uppercase; letter-spacing: 2px;}
h4 { font-size: 16px; font-weight: bold; }
.badge-light { background-color: white; }
body.bg-light { background-color: white!important; }
</style>