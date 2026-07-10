declare module 'mjml' {
  export default function mjml(
    source: string,
    options?: Record<string, unknown>,
  ): {
    html: string;
    errors?: unknown[];
  };
}
