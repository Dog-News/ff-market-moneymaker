<template>
    <div>
        <!-- <button @click="updateMarketData">Update market data</button> -->
        <!-- Item ID: <input type="text" v-model="itemID"/> -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-5 p-4">
        <div class="d-flex w-100 justify-content-end">
        <div class="d-flex">
                <select class="custom-select" @change="test" v-model="selectedDataCenter">
                    <option value="Aether">Aether</option>
                    <option value="Primal">Primal</option>
                    <option value="Crystal">Crystal</option>
                </select>
        
                <!-- <button class="btn btn-primary ml-2" @click="test">Go</button>
                <div>{{ datadump }}</div> -->
            </div>
        </div>
        </nav>
             <div class="container pt-5">

            <div class="row">
                <div class="col-md-12 m-auto">
                <h1 class="mb-5">Cross Data Center</h1>
            </div>
            </div>
            </div>
        <div class="container">

            <div class="row">
                <div class="col-md-12 m-auto">
                    <div class="float-left">
                    <div class="d-flex">
                        <b-form-group class="mb-0">
                            <b-input-group size="sm">
                                <b-form-input id="filter-input" v-model="itemNameFilter" type="search" placeholder="Type to Search" debounce="200"></b-form-input>
                            <b-input-group-append>
                                <b-button :disabled="!itemNameFilter" @click="itemNameFilter = ''">Clear</b-button>
                            </b-input-group-append>
                            </b-input-group>
                        </b-form-group>
                    
                        <!-- <b-dropdown id="dropdown-1" text="Filter by Job" class="ml-4" variant="outline-dark">
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
                        </b-dropdown> -->
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
                        <b-button class="ml-1" @click="itemNameFilter = null; minVolumeFilter = null; minProfitFilter = null; minProfitPercentFilter = null;">Clear Filters</b-button>
                    </div>
                    
                    </div>
                    <div class="float-right">
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
                        selectable
                        :per-page="perPage" 
                        :current-page="currentPage" 
                        :fields="tableFields" 
                        :items="filteredItems"
                        sort-direction="desc"
                        @row-clicked="item=>$set(item, '_showDetails', !item._showDetails)"

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
                                <nuxt-img :src="'/images/icon2x/' + row.item.itemID + '.png'" width="56" />
                                <img class="icon-overlay" src="/images/image-overlay.png">
                            </div>
                            <div>
                                <h4 class="mb-1">{{row.item.itemName}} <img style="margin-top:-2px" :src="row.item.hq ? '/images/hq-light.png' : ''"></h4>
                                <a :href="'https://universalis.app/market/' + row.item.itemID" :target="'_blank'"><span class="badge badge-pill badge-light">#{{row.item.itemID}}</span></a>
                            </div>
                            </div>
                        </template>

                        <template #cell(medianPrice)="medianPrice">
                            <div>
                                
                                <div class="pb-1 small font-weight-bold">{{medianPrice.value}} ɢ</div>
                                <span class="badge badge-pill badge-light">{{medianPrice.item.dataCenterName}} - {{medianPrice.item.saleCount}}</span>
                            </div>
                        </template>

                        <template #cell(selectedDataCenterMedian)="selectedDataCenterMedian">
                            <div>
                                
                                <div class="pb-1 small font-weight-bold">{{selectedDataCenterMedian.value}} ɢ</div>
                                <span class="badge badge-pill badge-light">{{selectedDataCenter}} - {{selectedDataCenterMedian.item.selectedSaleCount}}</span>
                            </div>
                        </template>


                        <template #cell(predictedTotalProfit)="predictedTotalProfit">
                            <span :class="predictedTotalProfit.unformatted > 0 ? 'good' : 'bad'">{{predictedTotalProfit.value}}</span>
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
                <div class="col-md-12 m-auto">
                    <div class="float-right">
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
                // {key: "itemID", label: "Item ID", sortable: true},
                // {key: "hq", label: "Quality", sortable: true},
                // {key: "itemName", label: "Name", sortable: true, class:"table-text-data"},
                // {key: "predictedTotalProfit", label: "Total Profit", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US") + " ɢ"}},
                // {key: "difference", label: "Profit", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US")  + " ɢ"}},
                // {key: "profitPercentage", label: "Profit %", sortable: true, class: (value, key, item) => {return item.profit > 0 ? 'good' : 'bad'}, formatter: (value) => {return value?.toLocaleString("en-US") + "%"}},
                // {key: "quantitySold", label: "Volume", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                // {key: "averageStackSize", label: "Avg. Stack", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US")}},
                // {key: "worldName", label: "World", sortable: true, class:["table-text-data", "world-section"]},
                // {key: "medianPrice", label: "Purchase", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")  + " ɢ"}},
                // {key: "saleCount", label: "Sales", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                // // {key: "selectedWorld", label: "World (Home)"},
                // {key: "selectedWorldMedian", label: "Sell", sortable: true, class: "world-section", formatter: (value) => {return value?.toLocaleString("en-US") + " ɢ"}},
                // {key: "selectedSaleCount", label: "Sales", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},

                {key: "itemName", class:"text-left", sortable: true},
                // {key: "dataCenterName", sortable: true},
                {key: "selectedSaleCount", label: "Vol", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                {key: "averageStackSize", label: "Stack", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                {key: "medianPrice", label: "Buy", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                {key: "selectedDataCenterMedian", label:"Sell", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                // {key: "saleCount", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                // {key: "quantitySold", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                // {key: "difference", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US")}},
                {key: "predictedTotalProfit", label: "Profit", class: "font-weight-bold", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US") + " ɢ"}},
                {key: "profitPercentage", label: "Profit %", sortable: true, formatter: (value) => {return Math.floor(value).toLocaleString("en-US") + "%"}},
            ],
            medianSaleData: null,
            datadump: null,
            selectedDataCenter: "Primal",
            selectedDataCenterPrice: null,
            selectedDataCenterForData: null, // for displaying in the table after request
            totalRows: 0,
            currentPage: 1,
            perPage: 50,
            itemNameFilter: null,
            // craftTypeFilter: [],
            minVolumeFilter: null,
            minProfitFilter: null,
            minProfitPercentFilter: null,
            filterOn: ["name"]
        }
    },
    async mounted() {
        this.totalRows = this.medianSaleData?.length;
        this.test();
    },
    methods: {
        async test() {
            if (!this.selectedDataCenter) return;
            const data = await this.$axios.$get(`http://localhost:4001/api/getMedianSoldPrice/allItems/${this.selectedDataCenter}`);
            this.medianSaleData = data;
            this.selectedDataCenterForData = this.selectedDataCenter // do this so changing drop down menu doesn't update the table display until requested again
            this.totalRows = this.medianSaleData?.length;
        },
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems?.length
            this.currentPage = 1
        }
    },
    computed: {
        // filteredItems() {
        //     return this.medianSaleData;
        // },
        filteredItems() {
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

            const filteredMedianSaleData = this.medianSaleData?.filter((item) => {
                const itemName = item.itemName;
                const selectedDataCenterVolume = item.selectedSaleCount;
                const lowestMedianDataCenterVolume = item.saleCount;
                const profit = item.predictedTotalProfit;
                const profitPercent = item.profitPercentage;
                const itemNameMatchesFilter = checkItemNameMatchesFilter(itemName);
                const minVolume1Filter = checkMinVolumeFilter(selectedDataCenterVolume);
                const minVolume2Filter = checkMinVolumeFilter(lowestMedianDataCenterVolume);
                const minProfitFilter = checkMinProfitFilter(profit);
                const minProfitPercentFilter = checkMinProfitPercent(profitPercent);
                return (itemNameMatchesFilter && minVolume1Filter && minVolume2Filter && minProfitFilter && minProfitPercentFilter);
            });

            // if no filter, return the unfiltered list of items
            this.totalRows = filteredMedianSaleData?.length
            return filteredMedianSaleData;
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