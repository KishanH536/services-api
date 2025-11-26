import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  S3,
} from '@aws-sdk/client-s3'

import {
  AWS_REGION as region,
  S3_BUCKET as Bucket,
  S3_SNAPSHOT as snapshot,
  S3_ORIGINAL_IMAGES as originalImages,
  S3_TAMPERING_REF as tamperingRef,
} from '../../config/aws.js'

const s3 = new S3({ region })

async function uploadObject(Key, Body, ContentType) {
  return new Upload({
    client: s3,
    params: {
      Key,
      Body,
      ContentType,
      Bucket,
    },
  }).done()
}

async function deleteObject(Key) {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  })
  return s3.send(command)
}

function deleteObjects(params) {
  const command = new DeleteObjectsCommand(params)
  return s3.send(command)
}

async function uploadTamperingRef(id, { buffer, type }) {
  const contentType = `image/${type}`
  const key = [tamperingRef, id].join('/')
  const { Key } = await uploadObject(key, buffer, contentType)
  return Key
}

async function getTamperingRefUrl(key) {
  return await getSignedUrl(s3, new GetObjectCommand({
    Bucket,
    Key: `${tamperingRef}/${key}`,
  }), {
    expiresIn: 3600,
  })
}

// TODO: need to support snapshot mimetypes which are not jpg.
async function getSnapshotUrl(key) {
  return await getSignedUrl(s3, new GetObjectCommand({
    Bucket,
    Key: `${snapshot}/${key}.jpg`,
  }), {
    expiresIn: 3600,
  })
}

async function getOriginalImagesUrl(key) {
  return await getSignedUrl(s3, new GetObjectCommand({
    Bucket,
    Key: `${originalImages}/${key}.jpg`,
  }), {
    expiresIn: 3600,
  })
}

// TODO: need to support snapshot mimetypes which are not jpg.
// Currently Services API and api-server save snapshots with the `jpg`
// extension, regardless of mimetype. Keeping the same behaviour here
// for now so that getting the snapshot still works.
async function uploadSnapshot(id, buffer, type = 'jpg') {
  const contentType = `image/${type}`
  const key = `${snapshot}/${id}.${type}`
  const { Key } = await uploadObject(key, buffer, contentType)
  return Key
}

async function deleteTamperingRef(id) {
  const key = [tamperingRef, id].join('/')
  await deleteObject(key)
}

async function deleteTamperingRefs(ids) {
  if (ids.length !== 0) {
    const params = {
      Bucket,
      Delete: {
        Objects: ids.map(
          (id) => ({ Key: [tamperingRef, id].join('/') }),
        ),
        Quiet: true,
      },
    }
    await deleteObjects(params)
  }
}

export {
  getSnapshotUrl,
  getOriginalImagesUrl,
  uploadSnapshot,
  getTamperingRefUrl,
  uploadTamperingRef,
  deleteTamperingRef,
  deleteTamperingRefs,
}
