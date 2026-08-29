const user = {
  id: 1,
  username: "123",
};
const files = [
  {
    fileId: 1,
    fileName: 1,
    mimetype: "text/plain",
    ownerId: 1,
    size: 500,
    uploadTime: 1,
    usrFileName: "123@Home/Avatar",
  },
  {
    fileId: 2,
    fileName: 2,
    mimetype: "text/plain",
    ownerId: 1,
    size: 500,
    uploadTime: 2,
    usrFileName: "123@Home/something",
  },
];
if (files.length == 0) {
  console.log("No files");
} else {
  console.log("yep, files");
  files.forEach((element) => {
    let filetype;
    const extensions = [
      "ae",
      "avi",
      "css",
      "csv",
      "excel",
      "file",
      "html",
      "illustrator",
      "jpeg",
      "mpeg",
      "ms-powerpoint",
      "other",
      "pdf",
      "photoshop",
      "png",
      "quicktime",
      "rar",
      "txt",
      "wave",
      "word",
      "x-eps",
      "zip",
    ];
    const mimetype = element.mimetype.split("/");
    let first = mimetype[0];
    let second = mimetype[1];
    if (first == "text") {
      filetype = "txt";
    }
    if (second == "octet-stream") {
      filetype = "other";
    }
    const splitElement = second.split(".");
    console.log("splitElement of element:", element, splitElement);
    for (let i = 0; i < splitElement.length; i++) {
      if (extensions.includes(splitElement[i])) {
        filetype = splitElement[i];
        break;
      }
    }
    if (!filetype) {
      filetype = "other";
    }
    if (element.usrFileName != user.username + "@Home/avatar") {
      const loadedFolders = [];
      const fileName = element.usrFileName;
      let finalName;
      let finalImage;
      let currentFolder = "Home";
      const folders = fileName.split("/");
      if (folders.length > 2) {
        for (let i = 1; i < folders.length - 1; i++) {
          if (!loadedFolders.includes(folders[i])) {
            loadedFolders.push(folders[i]);
            console.log(
              "loaded folders: ",
              loadedFolders,
              "folders:",
              folders[i],
            );
          }
        }
      }
      console.log("image: ", filetype);
    }
  });
}
