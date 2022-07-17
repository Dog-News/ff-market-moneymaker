<template>
    <div>
        <!-- <button @click="updateMarketData">Update market data</button> -->
        <!-- Item ID: <input type="text" v-model="itemID"/> -->
        <br>
        World to compare: 
        <select v-model="selectedWorld">
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
        <div>{{ datadump }}</div>
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-sm table-bordered small">
                        <tr>
                            <th>#</th>
                            <th>Quality</th>
                            <th>Name</th>
                            <th>Profit</th>
                            <th>World (Cheapest)</th>
                            <th>Purchase</th>
                            <th style="max-width: 50px">Sales</th>
                            <th>World (Home)</th>
                            <th>Sell</th>
                            <th style="max-width: 50px">Sales</th>
                        </tr>
                        <tr v-for="item of filteredMedianSaleData">
                            <td><a :href="'https://universalis.app/market/' + item.itemID" :target="'_blank'">{{item.itemID}}</a></td>
                            <td>{{item.hq ? 'High' : 'Normal'}}</td>
                            <td style="white-space: nowrap">{{item.itemName}}</td>
                            <td style="background-color: #32cd3238">{{item.difference?.toLocaleString("en-US")}}</td>
                            <td>{{item.worldName}}</td>
                            <td>{{item.medianPrice?.toLocaleString("en-US")}}</td>
                            <td>{{item.saleCount?.toLocaleString("en-US")}}</td>
                            <td style="background-color: #ffe4b533">{{selectedWorld}}</td>
                            <td style="background-color: #ffe4b533">{{item.selectedWorldMedian?.toLocaleString("en-US")}}</td>
                            <td style="background-color: #ffe4b533">{{item.selectedSaleCount?.toLocaleString("en-US")}}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return{
            medianSaleData: null,
            datadump: null,
            selectedWorld: "Excalibur",
            selectedWorldPrice: null
        }
    },
    async mounted() {
        // await this.getMedianSoldPrice();
    },
    methods: {
        async test() {
            if (!this.selectedWorld) return;
            const data = await this.$axios.$get(`http://localhost:4000/api/getMedianSoldPrice/allItems/${this.selectedWorld}`);
            this.medianSaleData = data;
        },
    },
    computed: {
        filteredMedianSaleData() {
            return this.medianSaleData?.filter((e) => {return e.difference > 0});
        }
    },
    name: 'IndexPage'
}
</script>
