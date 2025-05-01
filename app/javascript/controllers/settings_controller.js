import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rootPath", "selectDirectory", "updateRootPath"]

  connect() {
    this.setupEventListeners()
  }
}
