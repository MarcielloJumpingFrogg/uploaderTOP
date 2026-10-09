type element = {
  type: string;
  item: item;
};

type item = {
  name: string;
  id: string;
  updated_at: Date;
  created_at: Date;
  last_accessed_at: Date;
  metadata: metadata;
};

type metadata = {
  eTag: string;
  size: number;
  mimetype: string;
  cacheControl: string;
  lastModified: Date;
  contentLength: number;
  httpStatusCode: number;
};

type finalFile = {
  name: string;
  id: string;
  size: string;
  type: any;
  updated_at: Date;
  created_at: Date;
  metadata: metadata;
};

export type { element, item, metadata, finalFile };
