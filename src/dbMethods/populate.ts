import { prisma } from "@prisma";
import { tryCatch } from "@/customErrors/tryCatch";
import bcrypt from "bcryptjs";
import logger from "../../config/logger";

async function populate() {
  const hashedPassword = await bcrypt.hash("Password1234!", 10);
  const { data, error } = await tryCatch(
    prisma.users.createMany({
      data: {
        username: "ffox",
        password: hashedPassword,
        fileList: {
          create: [
            {
              parentFolderId: "Home",
              fileName: "BigFolder",
              type: "FOLDER",
              fileType: "folder",
              subFolders: {
                create: [
                  {
                    fileName: "Medium Folder",
                    type: "FOLDER",
                    fileType: "folder",
                    subfolders: {
                      create: [
                        {
                          fileName: "Small Folder",
                          type: "FOLDER",
                          fileType: "folder",
                          subFolders: {
                            create: [
                              {
                                fileName: "Last File",
                                type: "FILE",
                                fileType: "pdf",
                              },
                            ],
                          },
                        },
                        {
                          fileName: "Small File",
                          type: "FILE",
                          fileType: "txt",
                        },
                      ],
                    },
                  },
                  {
                    fileName: "Medium File",
                    type: "FILE",
                    fileType: "jpg",
                  },
                ],
              },
            },
            {
              parentFolderId: "Home",
              fileName: "Other File",
              type: "FILE",
              fileType: "txt",
            },
          ],
        },
      },
    }),
  );

  if (error) {
    logger.error("error: ", error);
    return;
  }
}

populate();
