import { type FC } from 'react';
import { DocSection, DocList, DocNote, DocCommand } from '../../../common';

export const RequirementsSection: FC = () => (
  <DocSection title="Требования">
    <p>Перед началом работы убедитесь, что у вас установлены:</p>
    <DocList
      items={[
        'Node.js версии 18 или выше',
        'npm версии 9 или выше (обычно поставляется с Node.js)',
      ]}
    />
    <DocNote type="info" title="Проверка версий">
      <DocCommand
        command="node --version"
        description="Должно быть v18.x.x или выше"
      />
      <DocCommand
        command="npm --version"
        description="Должно быть 9.x.x или выше"
      />
    </DocNote>
  </DocSection>
);
