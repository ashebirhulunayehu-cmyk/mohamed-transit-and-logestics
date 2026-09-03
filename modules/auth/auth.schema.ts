import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "የተጠቃሚ ስም ማስገባት ግዴታ ነው"),
  password: z.string().min(6, "የይለፍ ቃል ከ 6 ፊደላት ማነስ የለበትም"),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;