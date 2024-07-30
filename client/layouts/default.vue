<template>
    <div id="layout">
        <sidebar />
        <div id="main">
            <topbar />
            <Nuxt />
        </div>
    </div>
</template>

<style>
body {
    background: black;
}
#layout {
    display: flex;
    padding: 16px;
}
#sidebar {
    width: 300px;
}
#main {
    width: 100%;
}
.content-area {
    background-color: white; 
    border-radius: 16px;
}
#topbar {
    width: 100%;
}
</style>