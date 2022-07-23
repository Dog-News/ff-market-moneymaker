<template>
    <div>
        <!-- <button @click="updateMarketData">Update market data</button> -->
        <!-- Item ID: <input type="text" v-model="itemID"/> -->
        <br>
        World to compare: 
        <select class="form-select" v-model="selectedWorld">
            <option :value="'Leviathan'">Leviathan</option>
            <option :value="'Famfrit'">Famfrit</option>
            <option :value="'Hyperion'">Hyperion</option>
            <option :value="'Ultros'">Ultros</option>
            <option :value="'Excalibur'">Excalibur</option>
            <option :value="'Behemoth'">Behemoth</option>
            <option :value="'Lamia'">Lamia</option>
            <option :value="'Exodus'">Exodus</option>
            <option :value="'Faerie'">Faerie</option>
            <option :value="'Siren'">Siren</option>
            <option :value="'Gilgamesh'">Gilgamesh</option>
            <option :value="'Cactuar'">Cactuar</option>
            <option :value="'Jenova'">Jenova</option>
            <option :value="'Adamantoise'">Adamantoise</option>
            <option :value="'Sargatanas'">Sargatanas</option>
            <option :value="'Midgardsormr'">Midgardsormr</option>
            <option :value="'Zalera'">Zalera</option>
            <option :value="'Malboro'">Malboro</option>
            <option :value="'Goblin'">Goblin</option>
            <option :value="'Coeurl'">Coeurl</option>
            <option :value="'Brynhildr'">Brynhildr</option>
            <option :value="'Diabolos'">Diabolos</option>
            <option :value="'Balmung'">Balmung</option>
            <option :value="'Mateus'">Mateus</option>
        </select>
        <br>
        <button @click="test">Go</button>
        <br>
        <br>
        <br>

        <b-row>

                <b-form-group
                label="Filter"
                label-for="filter-input"
                label-cols-sm="3"
                label-align-sm="right"
                label-size="sm"
                class="mb-0"
                >
                    <b-input-group size="sm">
                        <b-form-input
                            id="filter-input"
                            v-model="filter"
                            type="search"
                            placeholder="Type to Search"
                            debounce="1000"
                        ></b-form-input>

                        <b-input-group-append>
                            <b-button :disabled="!filter" @click="filter = ''">Clear</b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-form-group>

        </b-row>
        <br>
        <div>{{ datadump }}</div>
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-12 m-auto">
                    <b-pagination
                        v-model="currentPage"
                        :total-rows="totalRows"
                        :per-page="perPage"
                        aria-controls="item-table"
                    ></b-pagination>

                    <b-table 
                        id="item-table" 
                        :per-page="perPage" 
                        :current-page="currentPage" 
                        dark sticky-header="75vh" 
                        :fields="tableFields" 
                        :items="filteredMedianSaleData"
                        :filter="filter"
                        @filtered="onFiltered"
                    >
                        <template #thead-top="data">
                            <b-th colspan="8"><span class="sr-only"></span></b-th>
                            <b-th colspan="3" variant="secondary">Cheapest</b-th>
                            <b-th colspan="3" variant="primary">{{selectedWorldForData}}</b-th>
                        </template>

                        <template #cell(itemID)="itemID">
                            <a :href="'https://universalis.app/market/' + itemID.value" :target="'_blank'">{{itemID.value}}</a>
                        </template>

                        <template #cell(predictedTotalProfit)="predictedTotalProfit">
                            <span :class="predictedTotalProfit.unformatted > 0 ? 'good' : 'bad'">{{predictedTotalProfit.value}}</span>
                        </template>

                        <template #cell(difference)="difference">
                            <span :class="difference.unformatted > 0 ? 'good' : 'bad'">{{difference.value}}</span>
                        </template>

                        <template #cell(profitPercentage)="profitPercentage">
                            <span :class="profitPercentage.unformatted > 0 ? 'good' : 'bad'">{{profitPercentage.value}}</span>
                        </template>

                        <template #cell(selectedWorld)="selectedWorld">
                            {{selectedWorldForData}}
                        </template>
                    </b-table>
                    <b-pagination
                        v-model="currentPage"
                        :total-rows="totalRows"
                        :per-page="perPage"
                        aria-controls="item-table"
                    ></b-pagination>
                    <!-- <table class="table table-bordered table-sm small table-dark">
                        <tr class="header bg-dark">
                            <th>#</th>
                            <th>Quality</th>
                            <th style="max-width: 400px; text-align: left;">Name</th>
                            <th>Total Profit</th>
                            <th>Profit</th>
                            <th>Profit %</th>
                            <th>Volume</th>
                            <th>Avg. Stack</th>
                            <th style="text-align: left;">World (Cheapest)</th>
                            <th>Purchase</th>
                            <th style="max-width: 50px;">Sales</th>
                            <th>World (Home)</th>
                            <th>Sell</th>
                            <th style="max-width: 50px">Sales</th>
                        </tr>
                        <tr v-for="item of filteredMedianSaleData">
                            <td><a :href="'https://universalis.app/market/' + item.itemID" :target="'_blank'">{{item.itemID}}</a></td>
                            <td>{{item.hq ? 'HQ' : ''}}</td>
                            <td style="text-align: left;">{{item.itemName}}</td>
                            <td style="color: #a1e682; text-align: right;">{{Math.floor(item.predictedTotalProfit).toLocaleString("en-US")}} &#x0262;</td>
                            <td style="color: #a1e682; text-align: right;">{{item.difference?.toLocaleString("en-US")}}  &#x0262;</td>
                            <td>{{Math.floor((item.difference / item.medianPrice) * 100).toLocaleString("en-US")}}%</td>
                            <td>{{item.quantitySold.toLocaleString("en-US")}}</td>
                            <td>{{Math.floor(item.averageStackSize)}}</td>
                            <td style="text-align: left;">{{item.worldName}}</td>
                            <td>{{item.medianPrice?.toLocaleString("en-US")}} &#x0262;</td>
                            <td>{{item.saleCount?.toLocaleString("en-US")}}</td>
                            <td style="text-align: left;">{{selectedWorld}}</td>
                            <td>{{item.selectedWorldMedian?.toLocaleString("en-US")}} &#x0262;</td>
                            <td>{{item.selectedSaleCount?.toLocaleString("en-US")}}</td>
                        </tr>
                    </table> -->
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
                {key: "itemID", label: "Item ID", sortable: true},
                {key: "hq", label: "Quality", sortable: true, class:"table-text-data", formatter: (value) => {return value ? 'HQ' : ''}},
                {key: "itemName", label: "Name", sortable: true, class:"table-text-data"},
                {key: "predictedTotalProfit", label: "Total Profit", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US") + " ɢ"}},
                {key: "difference", label: "Profit", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US")  + " ɢ"}},
                {key: "profitPercentage", label: "Profit %", sortable: true, class: (value, key, item) => {return item.profit > 0 ? 'good' : 'bad'}, formatter: (value) => {return value?.toLocaleString("en-US") + "%"}},
                {key: "quantitySold", label: "Volume", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                {key: "averageStackSize", label: "Avg. Stack", sortable: true, formatter: (value) => {return Math.floor(value)?.toLocaleString("en-US")}},
                {key: "worldName", label: "World", sortable: true, class:["table-text-data", "world-1"]},
                {key: "medianPrice", label: "Purchase", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")  + " ɢ"}},
                {key: "saleCount", label: "Sales", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
                // {key: "selectedWorld", label: "World (Home)"},
                {key: "selectedWorldMedian", label: "Sell", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US") + " ɢ"}},
                {key: "selectedSaleCount", label: "Sales", sortable: true, formatter: (value) => {return value?.toLocaleString("en-US")}},
            ],
            medianSaleData: null,
            datadump: null,
            selectedWorld: "Excalibur",
            selectedWorldPrice: null,
            selectedWorldForData: null, // for displaying in the table after request
            totalRows: 0,
            currentPage: 1,
            perPage: 10,
            filter: null,
            filterOn: ["name"]
        }
    },
    async mounted() {
        this.totalRows = this.medianSaleData?.length;
    },
    methods: {
        async test() {
            if (!this.selectedWorld) return;
            const data = await this.$axios.$get(`http://localhost:4000/api/getMedianSoldPrice/allItems/${this.selectedWorld}`);
            this.medianSaleData = data;
            this.selectedWorldForData = this.selectedWorld // do this so changing drop down menu doesn't update the table display until requested again
            this.totalRows = this.medianSaleData?.length;
        },
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems?.length
            this.currentPage = 1
        }
    },
    computed: {
        filteredMedianSaleData() {
            return this.medianSaleData?.filter((e) => {return e.predictedTotalProfit > 0 && e.selectedSaleCount > 1 && ((e.difference / e.medianPrice) * 100) < 500});
        },
    },
    name: 'IndexPage'
}
</script>
<style>
    table td, table th { text-align: right; }
    .table-text-data { text-align: left; }
    .good {color: lightgreen}
    .good:before {content: "+ "}

    /*
     Fix an issue in vue-bootstrap v2.22.0:
    https://github.com/bootstrap-vue/bootstrap-vue/issues/6961 
    */
    .b-table-sticky-header > .table.b-table > thead > tr > th {
    position: sticky !important;
    }
    .world-heading {
        border-left: 1px solid white;
    }
</style>