import { GoogleGenAI, Type } from '@google/genai';

let aiInstance = null;

const getAI = () => {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
};

/**
 * Generate a personalized learning roadmap based on user's GitHub repositories and an optional user prompt.
 * @param {Array} repositories - List of user's GitHub repositories.
 * @param {String} userPrompt - Optional custom goal from the user.
 * @returns {Array} List of project objects for the roadmap.
 */
export const generateRoadmap = async (repositories, userPrompt = null) => {
  const ai = getAI();

  const customGoalSection = userPrompt 
    ? `\n    The user has a specific goal: "${userPrompt}". 
    Create a highly focused 5-step roadmap specifically to achieve this goal, taking their current skill level (inferred from their repositories) into account as a starting point.`
    : `\n    Generate a progressive 5-step project roadmap to help them reach a "Full-Stack Mastery" or "Advanced Software Engineer" level.`;

  const prompt = `
    You are an expert software engineering mentor. 
    Analyze the following list of repositories belonging to a user, and infer their current skill level and missing competencies.
    ${customGoalSection}
    
    User Repositories Data:
    ${JSON.stringify(repositories.map(repo => ({
      name: repo.name,
      language: repo.language,
      description: repo.description,
      topics: repo.topics || [],
      stargazers_count: repo.stargazers_count
    })), null, 2)}
    
    Generate exactly 5 projects in order of progression.
    Return a JSON array where each object has the following keys:
    - projectId: string (e.g., 'MOD-01')
    - title: string (e.g., '01. Todo App Architecture')
    - description: string (Detailed explanation of what to build and why)
    - difficulty: string (must be 'BEGINNER', 'INTERMEDIATE', or 'ADVANCED')
    - estTime: string (e.g., '4 HOURS', '2 WEEKS')
    - prereq: string (The projectId of the prerequisite, or 'NONE' for the first project)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              projectId: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              estTime: { type: Type.STRING },
              prereq: { type: Type.STRING },
            },
            required: ["projectId", "title", "description", "difficulty", "estTime", "prereq"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    throw error;
  }
};

/**
 * Generate code quality and security insights for a specific repository.
 * @param {Object} repository - Repository details.
 * @param {Object} context - { readme, structure, commits }
 * @returns {Array} List of insight objects.
 */
export const generateRepoInsights = async (repository, context = {}) => {
  const ai = getAI();

  const prompt = `
    You are an expert Senior Software Engineer and Security Reviewer.
    Analyze the following repository metadata, its top-level file structure, recent commits, and README.
    Infer potential architecture, performance, or security issues typical for this stack.
    Be highly specific and actionable based on the provided context.
    
    Repository Data:
    Name: ${repository.name}
    Description: ${repository.description || 'No description'}
    Language: ${repository.language || 'Unknown'}
    
    Recent Commits:
    ${(context.commits || []).join('\n')}
    
    File Structure:
    ${(context.structure || []).join('\n')}
    
    README Snippet (first 1000 chars):
    ${context.readme ? context.readme.substring(0, 1000) : 'No README'}
    
    Generate exactly 4 realistic and highly specific insights (code reviews, vulnerabilities, or performance tips).
    Return a JSON array where each object has the following keys:
    - insightId: string (e.g., 'INS-101')
    - type: string ('VULNERABILITY', 'PERFORMANCE', 'ARCHITECTURE', 'BEST_PRACTICE')
    - severity: string ('error', 'warning', 'info')
    - title: string
    - description: string
    - file: string (e.g., 'package.json', 'src/main.js', 'Dockerfile' - guess the file based on context)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              insightId: { type: Type.STRING },
              type: { type: Type.STRING },
              severity: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              file: { type: Type.STRING },
            },
            required: ["insightId", "type", "severity", "title", "description", "file"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating repo insights:', error);
    throw error;
  }
};

/**
 * Generate a detailed project plan and 3 timeline options.
 */
export const generateProjectPlan = async (projectTitle, projectDescription) => {
  const ai = getAI();

  const prompt = `
    You are an expert tech lead. A user is starting a project: "${projectTitle}".
    Description: "${projectDescription}"
    
    Provide a detailed project plan including:
    - scope: A string summarizing the project boundaries.
    - objectives: An array of 3-5 key outcomes.
    - methodologies: An array of 2-3 development methodologies (e.g. "TDD", "Agile sprint").
    - techStack: An array of 3-6 recommended technologies.
    - timelineOptions: Exactly 3 options (e.g. 1 week, 2 weeks, 4 weeks), each with an 'id', 'title', 'duration', and 'description'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scope: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            methodologies: { type: Type.ARRAY, items: { type: Type.STRING } },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            timelineOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["id", "title", "duration", "description"]
              }
            }
          },
          required: ["scope", "objectives", "methodologies", "techStack", "timelineOptions"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating project plan:', error);
    throw error;
  }
};

/**
 * Split project into phases based on chosen timeline.
 */
export const generateProjectPhases = async (projectTitle, timelineDuration) => {
  const ai = getAI();

  const prompt = `
    A user is building "${projectTitle}" over a timeline of "${timelineDuration}".
    Break this project down into exactly 4 or 5 actionable phases.
    For each phase provide a phaseId, title, description, and an estimatedTime to complete it (e.g. "2 Days", "10 Hours").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phaseId: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedTime: { type: Type.STRING },
            },
            required: ["phaseId", "title", "description", "estimatedTime"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error('Error generating phases:', error);
    throw error;
  }
};
