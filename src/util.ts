class Utils {
  changeTitle(title: string) {
    document.getElementsByTagName("title")[0].innerHTML = title;
  }
}

export const util = new Utils();
