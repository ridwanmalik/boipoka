-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "filename" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" DATETIME,
    "lastPage" INTEGER NOT NULL DEFAULT 1,
    "totalPages" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_filename_key" ON "Book"("filename");
