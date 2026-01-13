import { type FC } from 'react';
import { DocSection, DocList, DocNote, DocCommand } from '../../../common';

export const RequirementsSection: FC = () => (
  <DocSection title="Требования">
    <p>Перед началом работы убедитесь, что у вас установлены:</p>

    <DocList
      items={[
        'Node.js версии 22.16 или выше',
        'npm версии 10 или выше (обычно поставляется с Node.js)',
      ]}
    />

    <DocNote type="info" title="Проверка версий">
      <DocCommand
        command="node --version"
        description="Должно быть v22.16.0 или выше"
      />
      <DocCommand
        command="npm --version"
        description="Должно быть 10.x.x или выше"
      />
    </DocNote>
  </DocSection>
);
