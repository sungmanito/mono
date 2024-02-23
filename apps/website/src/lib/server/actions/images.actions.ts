import { allowedImageTypes } from '$lib/util/images';
import type { SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { db } from '../db';
import schema from '@sungmanito/db';

/**
 *
 * @param supabase The supabase client
 * @param path the directory we are uploading to
 * @param image the File that represents the image
 * @param fileName the filename, defaults to the file's current name
 * @returns
 */
export async function uploadImage(
  supabase: SupabaseClient,
  path: string,
  image: File,
  fileName: string = image.name,
) {
  if (!allowedImageTypes.has(image.type))
    throw error(400, `Invalid image type: ${image.type}`);

  const bucket = supabase.storage.from(path);

  const { data: signedInfo, error: err } =
    await bucket.createSignedUploadUrl(fileName);
  if (err) throw error(400, err);

  const { data, error: uploadErr } = await bucket.uploadToSignedUrl(
    signedInfo.signedUrl,
    signedInfo.token,
    image,
  );
  if (uploadErr) throw error(400, uploadErr);

  return data;
}

export function getImagePathById(objectId: string) {
  return db.query.objects.findFirst({
    where: ({ id }, { eq }) => eq(id, objectId),
  });
}

export async function removeImageById(objectId: string, supabase: SupabaseClient) {
  const object = await getImagePathById(objectId);
  if(!object) throw new Error(`Could not find object with id "${objectId}"`);
  const bucket = supabase.storage.from(object.bucketId);

  const { data, error } = await bucket.remove([object.name]);

  if(error) {
    console.error(error);
    throw new Error(`Could not remove image "${object.name}"`)
  }

}

/**
 *
 * @param bucketName the bucket to the file is in
 * @param imagePath the path of the image in said bucket
 * @returns
 */
export async function getImageId(bucketName: string, imagePath: string) {
  const image = await db.query.objects.findFirst({
    where(fields, operators) {
      return operators.and(
        operators.eq(schema.objects.name, imagePath),
        operators.eq(schema.objects.bucketId, bucketName),
      );
    },
    columns: {
      id: true,
    },
  });

  if (!image)
    throw new Error(
      `Image could not be found: "${imagePath}" in bucket "${bucketName}"`,
    );

  return image.id;
}

/**
 *
 * @param supabase the supabase client
 * @param bucketName the bucket name
 * @param imageName the image name(s)
 * @returns
 */
export async function deleteImages(
  supabase: SupabaseClient,
  bucketName: string,
  imageName: string | string[],
) {
  const bucket = supabase.storage.from(bucketName);

  const { data, error } = await bucket.remove(
    ([] as string[]).concat(imageName),
  );

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}
