import "./css/main.css";

$('.black-bg').width($('#side').width());
function onResize() {
$('.black-bg').outerWidth($('#side').outerWidth());
}

window.addEventListener('resize', onResize, false);