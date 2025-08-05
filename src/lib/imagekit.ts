
import ImageKit from 'imagekit';

function getImageKitClient(): ImageKit | null {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    if (publicKey && privateKey && urlEndpoint) {
        const imagekit = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint,
        });
        return imagekit;
    } else {
        console.warn("ImageKit SDK could not be initialized. Missing one or more environment variables.");
        if (!publicKey) console.warn("IMAGEKIT_PUBLIC_KEY is missing.");
        if (!privateKey) console.warn("IMAGEKIT_PRIVATE_KEY is missing.");
        if (!urlEndpoint) console.warn("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is missing.");
        return null;
    }
}

export const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/mdjzw07s9";

export { getImageKitClient };
