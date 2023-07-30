const spinner = {
  on() {
    document.getElementById('spinner').style.display = 'inline-block'
  },
  off() {
    document.getElementById('spinner').style.display = 'none'
  },
}

export default spinner
