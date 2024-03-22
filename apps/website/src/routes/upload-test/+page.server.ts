import { fail } from '@sveltejs/kit';
import { ulid } from 'ulidx';

export const load = async ({ locals }) => {
  const { data: files, error } = await locals.supabase.storage
    .from('payment-proof')
    .list('01HMQ47JV6Q5CVPXH64SY7AZS2');
  console.info('fother', files);
  if (error) return fail(400);

  return {
    files: files.map(
      (f) =>
        locals.supabase.storage
          .from('payment-proof')
          .getPublicUrl(`01HMQ47JV6Q5CVPXH64SY7AZS2/${f.name}`).data.publicUrl,
    ),
  };
};

export const actions = {
  upload: async ({ request, locals }) => {
    const fd = await request.formData();
    const file = fd.get('testing');
    if (!file || typeof file === 'string') {
      return fail(400);
    }

    if (!file.type.startsWith('image')) return fail(401);

    console.info(file);

    const [, fileExt] = file.type.split('/');

    const fileName = `01HMQ47JV6Q5CVPXH64SY7AZS2/${ulid()}.${fileExt}`;
    const { data, error: signedError } = await locals.supabase.storage
      .from('payment-proof')
      .createSignedUploadUrl(fileName);

    if (signedError) return fail(400, { message: signedError.message });

    const { data: uploadData, error: uploadError } =
      await locals.supabase.storage
        .from('payment-proof')
        .uploadToSignedUrl(fileName, data.token, file);

    if (uploadError) return fail(400, { message: uploadError.message });

    return {
      filename: uploadData?.fullPath,
      name: uploadData?.path,
    };
  },
};
