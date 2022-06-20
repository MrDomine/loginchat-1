window.onload = () => {
  if ($("#error").text() != "##err##") {
    $("#error").show();
  } else {
    $("#error").hide();
  }
}