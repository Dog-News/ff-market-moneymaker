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
    background-color: #030510;
    background-image: url("/images/page-background.png");
    background-size: cover;
    background-attachment: fixed;
}
#layout {
    display: flex;
    padding: 16px 16px 16px 0;
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