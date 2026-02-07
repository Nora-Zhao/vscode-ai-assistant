import * as path from 'path';
import { SupportedLanguage } from '../interfaces';
import { BaseLanguageAdapter } from './BaseAdapter';

/**
 * Java 语言适配器
 * 支持 Maven 和 Gradle 构建工具，JUnit 5 测试框架
 */
export class JavaAdapter extends BaseLanguageAdapter {
  readonly language: SupportedLanguage = 'java';
  private buildTool: 'maven' | 'gradle' = 'maven';
  private useKotlinDsl = false;

  async detect(workspaceRoot: string): Promise<boolean> {
    const pomPath = path.join(workspaceRoot, 'pom.xml');
    const gradlePath = path.join(workspaceRoot, 'build.gradle');
    const gradleKtsPath = path.join(workspaceRoot, 'build.gradle.kts');

    if (await this.fileExists(pomPath)) {
      this.buildTool = 'maven';
      return true;
    }
    if (await this.fileExists(gradleKtsPath)) {
      this.buildTool = 'gradle';
      this.useKotlinDsl = true;
      return true;
    }
    if (await this.fileExists(gradlePath)) {
      this.buildTool = 'gradle';
      return true;
    }
    return false;
  }

  getDependencyFile(workspaceRoot: string): string | undefined {
    if (this.buildTool === 'maven') return path.join(workspaceRoot, 'pom.xml');
    return path.join(workspaceRoot, this.useKotlinDsl ? 'build.gradle.kts' : 'build.gradle');
  }

  getAuditCommand(): string {
    return this.buildTool === 'maven'
      ? 'mvn dependency-check:check'
      : './gradlew dependencyCheckAnalyze';
  }

  getTestCommand(testFile?: string): string {
    if (this.buildTool === 'maven') {
      return testFile ? `mvn test -Dtest=${this.getBaseName(testFile, '.java')}` : 'mvn test';
    }
    return testFile ? `./gradlew test --tests ${this.getBaseName(testFile, '.java')}` : './gradlew test';
  }

  getBuildCommand(): string {
    return this.buildTool === 'maven' ? 'mvn package -DskipTests' : './gradlew build -x test';
  }

  getFormatCommand(): string {
    return this.buildTool === 'maven' 
      ? 'mvn spotless:apply' 
      : './gradlew spotlessApply';
  }

  getLintCommand(): string {
    return this.buildTool === 'maven' 
      ? 'mvn checkstyle:check' 
      : './gradlew checkstyleMain';
  }

  getTestFilePattern(sourceFile: string): string {
    const base = this.getBaseName(sourceFile, '.java');
    // src/main/java/... -> src/test/java/...
    const testPath = sourceFile.replace('/main/', '/test/');
    const dir = this.getDirName(testPath);
    return path.join(dir, `${base}Test.java`);
  }

  getTestTemplate(className?: string): string {
    const name = className || 'MyClass';
    return `package com.example;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class ${name}Test {

    private ${name} sut; // System Under Test

    @BeforeEach
    void setUp() {
        sut = new ${name}();
    }

    @Test
    @DisplayName("should be instantiated")
    void shouldBeInstantiated() {
        assertNotNull(sut);
    }

    // TODO: Add more test cases
}
`;
  }

  getCodeReviewFocus(): string[] {
    return [
      '检查线程安全问题 (synchronized, volatile)',
      '检查空指针异常风险 (null check)',
      '检查 SOLID 原则遵守情况',
      '检查资源泄漏 (try-with-resources)',
      '检查异常处理是否恰当',
      '检查集合操作的线程安全',
    ];
  }

  parseDependencies(content: string): string[] {
    const deps: string[] = [];
    // Maven POM.xml 解析
    const depRegex = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<\/dependency>/g;
    let match;
    while ((match = depRegex.exec(content)) !== null) {
      deps.push(`${match[1]}:${match[2]}`);
    }
    return deps;
  }
}
