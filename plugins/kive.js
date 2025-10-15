import axios from "axios";

// The KiveClient class handles the API interactions for image generation.
class KiveClient {
  constructor() {
    this.firebaseKey = "AIzaSyBYwZOIHYtiMznRurZI9TtJDhW0b-m97tI";
    this.graphqlURL = "https://kive-graphql-auu6epeciq-uc.a.run.app/api";
    this.email = null;
    this.password = null;
    this.idToken = null;
    this.localId = null;
    this.workspaceId = null;
  }

  // Generates a random name.
  genName() {
    const firstNames = ["Alex", "Sam", "Taylor", "Jordan", "Casey", "Jamie", "Morgan", "Riley", "Quinn", "Dakota"];
    const lastNames = ["Smith", "Johnson", "Brown", "Lee", "Wang", "Garcia", "Miller", "Davis", "Rodriguez", "Wilson"];
    return {
      first: firstNames[Math.floor(Math.random() * firstNames.length)],
      last: lastNames[Math.floor(Math.random() * lastNames.length)]
    };
  }

  // Generates a random email address.
  genEmail() {
    return `user${Math.floor(Math.random() * 1e6)}@mail.com`;
  }

  // Generates a random password.
  genPass() {
    return `Pass${Math.floor(Math.random() * 1e4)}`;
  }

  // Returns headers for Firebase requests.
  fbHeaders() {
    return {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    };
  }

  // Returns headers for GraphQL requests, including authorization if available.
  gqlHeaders() {
    const headers = {
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      "origin": "https://kive.ai",
    };
    if (this.idToken) {
      headers["authorization"] = `Bearer ${this.idToken}`;
    }
    return headers;
  }

  // Signs up for a new account.
  async signup() {
    this.email = this.genEmail();
    this.password = this.genPass();
    const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.firebaseKey}`, {
      returnSecureToken: true,
      email: this.email,
      password: this.password
    }, {
      headers: this.fbHeaders()
    });
    this.idToken = response.data.idToken;
    this.localId = response.data.localId;
    return response.data;
  }

  // Sets up the user profile with a random name.
  async setupProfile() {
    const name = this.genName();
    const mutation = `
      mutation userProfileUpdate($firstName: String!, $lastName: String!) {
        userProfileUpdate(input: {firstName: $firstName, lastName: $lastName}) {
          id uid email firstName lastName displayName handle
        }
      }`;
    return await axios.post(this.graphqlURL, {
      operationName: "userProfileUpdate",
      variables: {
        firstName: name.first,
        lastName: name.last
      },
      query: mutation
    }, {
      headers: this.gqlHeaders()
    });
  }

  // Creates a new workspace for the user.
  async createWorkspace() {
    const mutation = `
      mutation addWorkspace {
        addWorkspace(input: {}) {
          id title url adminEmails permissions
        }
      }`;
    const response = await axios.post(this.graphqlURL, {
      operationName: "addWorkspace",
      variables: {},
      query: mutation
    }, {
      headers: this.gqlHeaders()
    });
    if (response.data.data?.addWorkspace?.id) {
      this.workspaceId = response.data.data.addWorkspace.id;
    }
    return response.data;
  }
  
  // Generates an image preview from a prompt.
  async genImgPreview(prompt, aspectRatio = "9:16", seed = 42) {
    const query = `
      query imageGenerationPreview($prompt: String!, $aspectRatio: String!, $seed: Int!) {
        imageGenerationPreview(input: {prompt: $prompt, aspectRatio: $aspectRatio, seed: $seed}) {
          url
        }
      }`;
    const headers = this.gqlHeaders();
    headers["x-tracking-context"] = JSON.stringify({
      platform: "web",
      url: "https://kive.ai/generate-image",
      workspaceId: this.workspaceId
    });
    return await axios.post(this.graphqlURL, {
      operationName: "imageGenerationPreview",
      variables: {
        prompt,
        aspectRatio,
        seed
      },
      query
    }, {
      headers,
      timeout: 30000
    });
  }

  // Main text-to-image generation process.
  async txt2img({ prompt, aspectRatio = "9:16", seed = 42 }) {
    if (!this.idToken) {
      await this.signup();
      await this.setupProfile();
      await this.createWorkspace();
    }
    const response = await this.genImgPreview(prompt, aspectRatio, seed);
    return {
      success: true,
      credentials: {
        email: this.email,
        password: this.password,
        localId: this.localId,
        workspaceId: this.workspaceId
      },
      preview: response.data.data?.imageGenerationPreview,
    };
  }
}

// The main handler function for the command.
let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply('Please provide a prompt. \n\n*Example:* .kive a cat wearing sunglasses');
  }

  try {
    await m.reply('🎨 Generating your image, please wait...');

    const client = new KiveClient();
    const result = await client.txt2img({ prompt: text });
    
    if (result.preview?.url) {
      const caption = `
✨ **Image Generated Successfully!**

🔑 **Credentials:**
📧 Email: ${result.credentials.email}
🔒 Password: ${result.credentials.password}
      `;

      // ✅ Send as image instead of sticker
      await conn.sendMessage(m.chat, {
        image: { url: result.preview.url },
        caption
      }, { quoted: m });

    } else {
      throw new Error('Failed to retrieve the generated image URL.');
    }
  } catch (error) {
    console.error(error);
    m.reply(`An error occurred: ${error.message || 'Unable to process your request.'}`);
  }
};

handler.help = ['kive'];
handler.command = ['kive'];
handler.tags = ['ai'];
handler.limit = true;

export default handler;
