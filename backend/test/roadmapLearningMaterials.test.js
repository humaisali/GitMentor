import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackLearningMaterials } from '../src/controllers/roadmapController.js';

test('learning material fallback prioritizes resources relevant to an authentication project', () => {
  const materials = buildFallbackLearningMaterials({
    title: 'Secure Authentication and Authorization System',
    description: 'Build login, password hashing, JWT sessions, and role-based access control.',
    detailedPlan: { techStack: ['Node.js', 'Express', 'React'] },
  });

  assert.equal(materials.length, 6);
  assert.equal(materials[0].source, 'OWASP');
  assert.match(materials[0].title, /Authentication/);
  assert.ok(materials.some(material => material.source === 'MDN Web Docs'));
  assert.ok(materials.some(material => material.source === 'Express Docs'));
  assert.ok(materials.every(material => /^https:\/\//.test(material.url)));
});

test('learning material fallback always supplies a useful baseline', () => {
  const materials = buildFallbackLearningMaterials({ title: 'Unclassified project' });

  assert.equal(materials.length, 4);
  assert.deepEqual(
    materials.map(material => material.source),
    ['MDN Web Docs', 'GitHub Skills', 'OWASP', 'web.dev']
  );
});
