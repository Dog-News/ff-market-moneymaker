<template>
    <div class="container">
        <div class="row">
            <div class="col-md-12 m-auto">
                <div class="mt-5">
                    <div class="mb-2 pt-5">
                        <span class="font-weight-bold">{{this.progress.stepNameText}}</span><span class="float-right">{{progress.descriptionText}}</span>
                    </div>
                    <div class="mb-5">
                        <b-progress :max="progress.overallProgressMax">
                            <b-progress-bar variant="primary" :value="progress.fetchingPrices.value" show-progress></b-progress-bar>
                            <b-progress-bar variant="success" :value="progress.updatingSQL.value" animated show-progress></b-progress-bar>
                            <b-progress-bar variant="info" :value="progress.calculatingMedians.value" striped show-progress></b-progress-bar>
                        </b-progress>
                    </div>
                    <button class="btn btn-primary" @click="startUpdateProcess" :disabled="!btnEnabled">Go</button>
                    <b-alert v-if="errorMsg" show variant="danger">{{errorMsg}}</b-alert>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return{
            btnEnabled: false,
            errorMsg: null,
            progress: {
                descriptionText: null,
                stepNameText: null,
                overallProgressMax: null,
                fetchingPrices: {
                    value: null,
                },
                updatingSQL: {
                    value: null,
                },
                calculatingMedians: {
                    value: null,
                },

            }
        }
    },
    mounted() {
        this.socket = this.$nuxtSocket({
            // nuxt-socket-io opts: 
            name: 'admin', // Use socket "home"
            channel: '', // connect to '/index'
            persist: true,
            timeout: 300000,
            // socket.io-client opts:
            reconnection: true
        });

        this.socket.emit('join', "admin");

        this.socket.on('update-status', (data) => {
            if (data.currentStepName) {
                this.progress.overallProgressMax = data.overallMax;
                this.progress.descriptionText = data.descriptionText;
                this.progress.stepNameText = data.currentStepNameText;
                this.progress[data.currentStepName].value = data.currentStepValue;
            }
        });

        this.socket.on('error', (data) => {
            this.errorMsg = data.message;
        });

        this.socket.on('change-btn-enabled', (data) => {
            this.btnEnabled = data;
        });

        this.socket.on('reset-progress', () => {
            this.resetProgress();
        });

        this.socket.on('update-done', (data) => {
            this.progress.stepNameText = "Done"
        });
        
    },
    methods: {
        startUpdateProcess() {
            this.resetProgress();
            this.errorMsg = null;
            this.socket.emit('update-data');
        },
        resetProgress() {
            this.progress.descriptionText = null;
            this.progress.stepNameText = null;
            this.progress.overallProgressMax = null;
            this.progress.fetchingPrices.value = null;
            this.progress.updatingSQL.value = null;
            this.progress.calculatingMedians.value = null;
        }
    },
    name: 'AdminPage'
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